/**
 * Manual tool-use loop shared by TraceDrop's agents.
 *
 * Runs Gemini with a donor-scoped tool set until it stops calling tools,
 * executing tool calls in parallel and returning the final text, the full
 * step trace (for the "how the agent decided" panel) and any UI actions the
 * agent requested via the navigate tool.
 */

const llm = require('./llm');
const tools = require('./tools');

const MAX_STEPS = 8;

async function runAgent({ feature, system, messages, donorId, toolNames, maxTokens = 3000, effort = 'low', outputSchema }) {
  const toolDefs = tools.definitions(toolNames);
  const convo = [...messages];
  const steps = [];
  const actions = [];

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const response = await llm.call({ feature, system, messages: convo, tools: toolDefs, maxTokens, effort, outputSchema });
    if (response.stop_reason === 'max_tokens') throw new llm.LLMUnavailable('Response cut off');

    const result = outputSchema ? llm.submitted(response) : null;
    if (result) return { result, steps, actions };

    const toolUses = response.content.filter((b) => b.type === 'tool_use' && b.name !== llm.SUBMIT);
    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      if (outputSchema) {
        // Finished in prose instead of submitting: ask once more for the structured result
        convo.push({ role: 'assistant', content: response.content });
        convo.push({ role: 'user', content: `Please submit your final result with the ${llm.SUBMIT} tool now.` });
        continue;
      }
      return { text: llm.text(response), steps, actions, messages: [...convo, { role: 'assistant', content: response.content }] };
    }

    convo.push({ role: 'assistant', content: response.content });
    const results = await Promise.all(toolUses.map(async (call) => {
      const started = Date.now();
      let output;
      let isError = false;
      try {
        output = tools.run(call.name, call.input, donorId);
      } catch (error) {
        output = { error: error.message };
        isError = true;
      }
      steps.push({ tool: call.name, input: call.input, ms: Date.now() - started, summary: summarise(call.name, output) });
      if (call.name === 'navigate') actions.push({ type: 'navigate', screen: call.input.screen, reason: call.input.reason });
      return { type: 'tool_result', tool_use_id: call.id, name: call.name, content: JSON.stringify(output), ...(isError ? { is_error: true } : {}) };
    }));
    convo.push({ role: 'user', content: results });
  }
  throw new llm.LLMUnavailable('Agent did not finish within the step limit');
}

/** Short human-readable description of a tool result for the trace panel. */
function summarise(name, output) {
  if (output && output.error) return `Error: ${output.error}`;
  if (Array.isArray(output)) return `${output.length} item(s)`;
  switch (name) {
    case 'get_profile': return `${output.name}, ${output.donations} donations, eligible now: ${output.eligibility.eligibleNow}`;
    case 'get_health_score': return `Latest score ${output.history.length ? output.history[output.history.length - 1].score : '—'}`;
    case 'get_insurance_cover': return `Cover ₹${(output.currentCover / 1e5).toFixed(0)}L, qualifies ₹${(output.eligibleCover / 1e5).toFixed(0)}L`;
    case 'simulate_cover': return `Score ${output.score} → ₹${(output.cover / 1e5).toFixed(0)}L`;
    case 'get_donation_impact': return `${output.totals.patientsHelped} patients helped from ${output.totals.components} components`;
    case 'get_protocol': return output.name;
    case 'get_lifestyle_guidance': return output.title;
    case 'navigate': return `Opened ${output.screen}`;
    default: return 'OK';
  }
}

module.exports = { runAgent };
