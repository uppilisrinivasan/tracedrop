/**
 * Message Generator Agent - Generates Personalized Health Messages
 * Uses LLM with ontology context, falls back to templates
 */

import { MessageOutput, Finding, Observation } from '../types/agents';
import { LLMClient } from '../llm/llmClient';
import { OntologyService } from '../services/ontologyService';
import { MessageTemplateService } from '../llm/messageTemplate';

export class MessageGeneratorAgent {
  private llmClient: LLMClient;
  private ontologyService: OntologyService;
  private templateService: MessageTemplateService;

  constructor(
    llmClient: LLMClient,
    ontologyService: OntologyService,
    templateService: MessageTemplateService
  ) {
    this.llmClient = llmClient;
    this.ontologyService = ontologyService;
    this.templateService = templateService;
  }

  /**
   * Generate personalized message
   */
  async generateMessage(
    finding: Finding,
    observation: Observation,
    language: string = 'en',
    donorName?: string
  ): Promise<MessageOutput> {
    // Try LLM first
    try {
      return await this.generateWithLLM(finding, observation, language, donorName);
    } catch (error) {
      // Fallback to templates
      return await this.generateWithTemplate(finding, observation, language);
    }
  }

  /**
   * Generate using LLM
   */
  private async generateWithLLM(
    finding: Finding,
    observation: Observation,
    language: string,
    donorName?: string
  ): Promise<MessageOutput> {
    const protocol = this.ontologyService.getProtocol(finding.protocolCode);
    const ontologyContext = this.ontologyService.getContextForMessage([finding.category]);

    const llmResponse = await this.llmClient.generateMessage({
      finding,
      observation,
      protocolContext: protocol,
      ontologyContext,
      language,
    });

    return {
      message: llmResponse.content,
      actionRequired: protocol?.recommendedAction || 'Consult healthcare provider',
      timeline: protocol?.followUpDays ? `${protocol.followUpDays} days` : 'As per protocol',
      language,
      alternatives: protocol?.lifestyle || [],
      tone: this.getTone(finding.severity),
      includesEducation: true,
      recommendedChannel: this.getChannel(finding.severity),
    };
  }

  /**
   * Generate using templates as fallback
   */
  private async generateWithTemplate(
    finding: Finding,
    observation: Observation,
    language: string
  ): Promise<MessageOutput> {
    const templateId = `${finding.category}_${language.toUpperCase()}`;
    const template = this.templateService.getTemplate(templateId);

    if (!template) {
      throw new Error(`No template found for ${templateId}`);
    }

    const variables = {
      value: observation.value,
      unit: observation.unit,
    };

    const message = this.templateService.substitute(template, variables);
    const protocol = this.ontologyService.getProtocol(finding.protocolCode);

    return {
      message,
      actionRequired: protocol?.recommendedAction || 'Follow medical advice',
      timeline: protocol?.followUpDays ? `${protocol.followUpDays} days` : 'As advised',
      language,
      alternatives: protocol?.lifestyle || [],
      tone: template.tone as 'urgent' | 'supportive' | 'informative' | 'preventive',
      includesEducation: false,
      recommendedChannel: this.getChannel(finding.severity),
    };
  }

  /**
   * Get tone based on severity
   */
  private getTone(severity: string): 'urgent' | 'supportive' | 'informative' | 'preventive' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'urgent';
      case 'medium':
        return 'supportive';
      default:
        return 'informative';
    }
  }

  /**
   * Get recommended channel based on severity
   */
  private getChannel(severity: string): 'sms' | 'whatsapp' | 'email' | 'app_notification' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'whatsapp';
      case 'medium':
        return 'app_notification';
      default:
        return 'email';
    }
  }
}

// Factory function
export function createMessageGeneratorAgent(
  llmClient: LLMClient,
  ontologyService: OntologyService,
  templateService: MessageTemplateService
): MessageGeneratorAgent {
  return new MessageGeneratorAgent(llmClient, ontologyService, templateService);
}
