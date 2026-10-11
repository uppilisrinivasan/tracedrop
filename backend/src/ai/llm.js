/**
 * Single gateway for every Claude call in TraceDrop.
 *
 *   - Rate limit: LLM_RATE_LIMIT_RPS requests/second (token bucket)
 *   - Budget: LLM_RATE_LIMIT_TOKENS_PER_DAY input+output tokens, reset daily;
 *     cache reads count at 10% since they are mostly free for the provider
 *   - Prompt caching on the stable prefix (system prompt + tools)
 *   - Typed error handling; refusals surface as a clean error
 *   - Every call is recorded in an in-memory trace log for the AI console
 *
 * If no API key is configured or the budget is exhausted, `available()`
 * returns false and callers fall back to their deterministic path, so the app
 * always works for a demo.
 */

const AnthropicModule = require('@anthropic-ai/sdk');

const Anthropic = AnthropicModule.default || AnthropicModule;

const MODEL = process.env.LLM_MODEL || 'claude-opus-5-5';
const RPS = Number(process.env.LLM_RATE_LIMIT_RPS || 10);
const DAILY_TOKENS = Number(process.env.LLM_RATE_LIMIT_TOKENS_PER_DAY || 100000);

// Credentials and endpoint are passed explicitly from the environment loaded
// from .env (see server.js), so nothing is silently picked up from elsewhere.
const API_KEY = (process.env.ANTHROPIC_API_KEY || '').trim();
const BASE_URL = (process.env.ANTHROPIC_BASE_URL || '').trim() || 'https://api.anthropic.com';
const ENDPOINT = (() => {
  try {
    return new URL(BASE_URL).host;
  } catch {
    return BASE_URL;
  }
})();

const client = API_KEY
  ? new Anthropic({ apiKey: API_KEY, authToken: null, baseURL: BASE_URL, maxRetries: 2, timeout: 120000 })
  : null;

const usage = { day: today(), tokens: 0, calls: 0, cacheReadTokens: 0 };
const traces = [];
let disabledReason = API_KEY ? null : 'No ANTHROPIC_API_KEY in .env';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rollDay() {
  if (usage.day !== today()) Object.assign(usage, { day: today(), tokens: 0, calls: 0, cacheReadTokens: 0 });
}

// Token bucket for requests per second
let bucket = RPS;
let lastRefill = Date.now();
async function acquire() {
  for (;;) {
    const now = Date.now();
    bucket = Math.min(RPS, bucket + ((now - lastRefill) / 1000) * RPS);
    lastRefill = now;
    if (bucket >= 1) {
      bucket -= 1;
      return;
    }
    await new Promise((r) => setTimeout(r, Math.ceil(((1 - bucket) / RPS) * 1000)));
  }
}

function available(estimatedTokens = 3000) {
  rollDay();
  if (!client || disabledReason) return false;
  return usage.tokens + estimatedTokens <= DAILY_TOKENS;
}

function status() {
  rollDay();
  return {
    model: MODEL,
    endpoint: ENDPOINT,
    live: available(0),
    reason: !client ? disabledReason : usage.tokens >= DAILY_TOKENS ? 'Daily token budget used up' : disabledReason,
    tokensUsedToday: usage.tokens,
    dailyTokenBudget: DAILY_TOKENS,
    callsToday: usage.calls,
    cacheReadTokens: usage.cacheReadTokens,
    rateLimitRps: RPS,
  };
}

function record(trace) {
  traces.unshift({ id: `T-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), ...trace });
  traces.length = Math.min(traces.length, 200);
}

class LLMUnavailable extends Error {}

/**
 * Structured output is delivered through a strict "submit" tool rather than
 * output_config.format: it validates against the schema on every endpoint
 * (some gateways drop output_config.format) and composes with other tools in
 * agent loops. The model is told to finish by calling it.
 */
const SUBMIT = 'submit_result';

function submitTool(schema) {
  return { name: SUBMIT, description: 'Submit the final result. Call this exactly once, as your last action.', strict: true, input_schema: schema };
}

/**
 * Call Claude. `feature` labels the call in traces. The system prompt is
 * cached (stable prefix), so repeated calls for a feature read it from cache.
 */
async function call({ feature, system, messages, tools, maxTokens = 4000, effort = 'low', outputSchema }) {
  if (!available(maxTokens)) throw new LLMUnavailable(status().reason || 'AI unavailable');
  await acquire();
  const started = Date.now();
  const allTools = [...(tools || []), ...(outputSchema ? [submitTool(outputSchema)] : [])];
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system: [{
      type: 'text',
      text: outputSchema ? `${system}\n\nWhen you are done, call the ${SUBMIT} tool with your final result. Do not write the result as text.` : system,
      cache_control: { type: 'ephemeral' },
    }],
    messages,
    output_config: { effort },
  };
  if (allTools.length) params.tools = allTools;

  try {
    const response = await client.messages.create(params);
    const u = response.usage || {};
    const billed = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0)
      + Math.round((u.cache_read_input_tokens || 0) * 0.1);
    usage.tokens += billed;
    usage.calls += 1;
    usage.cacheReadTokens += u.cache_read_input_tokens || 0;
    record({ feature, model: response.model, ms: Date.now() - started, stopReason: response.stop_reason,
      inputTokens: u.input_tokens, outputTokens: u.output_tokens, cacheReadTokens: u.cache_read_input_tokens || 0 });

    if (response.stop_reason === 'refusal') {
      throw new LLMUnavailable('The AI declined this request');
    }
    return response;
  } catch (error) {
    if (error instanceof LLMUnavailable) throw error;
    let reason = 'AI service error';
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      reason = `API key rejected by ${ENDPOINT} — check ANTHROPIC_API_KEY${process.env.ANTHROPIC_BASE_URL ? '' : ' (or set ANTHROPIC_BASE_URL if your key is for a gateway)'} in .env`;
      disabledReason = reason;
    } else if (error instanceof Anthropic.RateLimitError) {
      reason = 'AI provider rate limit reached';
    } else if (error instanceof Anthropic.BadRequestError) {
      reason = `Bad request: ${error.message}`;
    } else if (error instanceof Anthropic.APIConnectionError) {
      reason = 'Cannot reach the AI service';
    } else if (error instanceof Anthropic.APIError) {
      reason = `AI service error ${error.status}`;
    }
    record({ feature, model: MODEL, ms: Date.now() - started, error: reason });
    console.error(`[llm] ${feature}: ${reason}`);
    throw new LLMUnavailable(reason);
  }
}

function text(response) {
  return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
}

/** The structured result submitted via the submit tool, or null. */
function submitted(response) {
  const block = response.content.find((b) => b.type === 'tool_use' && b.name === SUBMIT);
  return block ? block.input : null;
}

/** Single-shot structured call: returns the submitted object or throws. */
async function json(options) {
  const response = await call(options);
  const result = submitted(response);
  if (!result) throw new LLMUnavailable('The AI did not return a structured result');
  return result;
}

/** Startup check: one tiny request to confirm the key works at the configured endpoint. */
async function verify() {
  if (!client) return { ok: false, reason: disabledReason };
  try {
    await call({ feature: 'startup_check', system: 'Reply with OK.', messages: [{ role: 'user', content: 'ping' }], maxTokens: 50 });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

module.exports = { call, text, json, submitted, available, status, verify, traces: () => traces, LLMUnavailable, MODEL, SUBMIT };
