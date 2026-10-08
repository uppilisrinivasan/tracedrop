/**
 * LLM Client - Anthropic API Wrapper
 * Handles communication with Claude API with safety guidelines
 */

import { LLMResponse, LLMContext, LLMMessage, LLMError } from '../types/agents';
import { RateLimiter } from './rateLimiter';

export class LLMClient {
  private rateLimiter: RateLimiter;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private systemPrompt: string;

  constructor(
    rateLimiter: RateLimiter,
    config: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ) {
    this.rateLimiter = rateLimiter;
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature || 0.7;

    // Medical safety guidelines
    this.systemPrompt = `You are TraceDrop, an AI medical assistant supporting blood donor health monitoring.

CRITICAL SAFETY GUIDELINES:
1. NEVER provide diagnosis - only support clinical decision-making
2. ALWAYS recommend human healthcare provider review before any action
3. ONLY provide information from medical protocols and donor health data
4. If uncertain, defer to medical professionals
5. Maintain patient privacy and confidentiality
6. Communicate in donor's preferred language clearly

MEDICAL CONTEXT:
- Work with vital signs: BP, Hemoglobin, Blood Sugar, TTI, etc.
- Use established protocols: BP-G1, BP-G2, HB-DEF, HB-SEV, etc.
- Reference lifestyle interventions only as support, not treatment
- Escalate critical findings immediately

TONE: Supportive, clear, empowering. Help donors understand health better.`;
  }

  /**
   * Generate message based on context
   */
  async generateMessage(context: LLMContext): Promise<LLMResponse> {
    if (!context.finding || !context.observation) {
      throw new LLMError('Missing finding or observation context', false);
    }

    const userPrompt = this.buildUserPrompt(context);
    const estimatedTokens = Math.ceil(userPrompt.length / 4) + this.maxTokens;

    try {
      return await this.rateLimiter.schedule(
        () => this.callAnthropicAPI([
          { role: 'user', content: userPrompt }
        ]),
        estimatedTokens
      );
    } catch (error) {
      throw new LLMError(`Failed to generate message: ${error}`, true);
    }
  }

  /**
   * Analyze health hiatus from text
   */
  async analyzeHealthStatus(text: string, language: string = 'en'): Promise<LLMResponse> {
    const userPrompt = `
Analyze this donor health report and identify key findings:

${text}

Respond in ${language} with:
1. Key observations
2. Severity level (low/medium/high/critical)
3. Recommended actions
4. Follow-up needed (yes/no)

Be concise and clear.`;

    const estimatedTokens = Math.ceil(userPrompt.length / 4) + this.maxTokens;

    try {
      return await this.rateLimiter.schedule(
        () => this.callAnthropicAPI([
          { role: 'user', content: userPrompt }
        ]),
        estimatedTokens
      );
    } catch (error) {
      throw new LLMError(`Failed to analyze health status: ${error}`, true);
    }
  }

  /**
   * Extract vitals from text description
   */
  async extractVitals(text: string): Promise<Record<string, string>> {
    const userPrompt = `
Extract vital signs from this text. Return as JSON:

"${text}"

Extract: BP (systolic/diastolic), Hb (value), FBS (value), HR (value), etc.
Return format: {"BP": "120/80", "Hb": "13.5", "FBS": "110", ...}
Return ONLY valid JSON, no explanation.`;

    try {
      const response = await this.rateLimiter.schedule(
        () => this.callAnthropicAPI([
          { role: 'user', content: userPrompt }
        ]),
        500
      );

      const jsonMatch = response.content.match(/\{[^}]+\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      throw new LLMError(`Failed to extract vitals: ${error}`, true);
    }
  }

  /**
   * Build user prompt from context
   */
  private buildUserPrompt(context: LLMContext): string {
    const { finding, observation, protocolContext, language = 'en' } = context;

    return `
Generate a supportive health message for a donor.

Finding: ${finding?.category} (${finding?.severity})
Observation: ${observation?.type} = ${observation?.value} ${observation?.unit}
Protocol: ${protocolContext?.name || 'Standard care protocol'}
Timeline: ${protocolContext?.timeline || 'Per protocol'}

Create a message in ${language} that:
1. Explains the finding in simple terms
2. Provides recommended actions
3. Supports next steps
4. Encourages positive health behavior

Be empathetic, clear, and action-oriented.`;
  }

  /**
   * Call Anthropic API (stub - requires actual SDK)
   */
  private async callAnthropicAPI(messages: LLMMessage[]): Promise<LLMResponse> {
    // In production, use @anthropic-ai/sdk
    // For now, return mock response
    const tokensUsed = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0) + 100;

    return {
      content: 'This is a mock LLM response. Integrate with @anthropic-ai/sdk in production.',
      tokensUsed,
      model: this.model,
      finishReason: 'end_turn',
    };
  }
}

// Factory function
export function createLLMClient(rateLimiter: RateLimiter): LLMClient {
  return new LLMClient(rateLimiter, {
    model: process.env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  });
}
