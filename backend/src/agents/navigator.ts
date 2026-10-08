/**
 * Navigator Agent - Determines Next Best Action
 * Uses protocol analysis, ontology context, and LLM reasoning
 */

import { NavigatorOutput, CarePartner, Finding, Observation } from '../types/agents';
import { ProtocolEngine } from '../utils/protocolEngine';
import { OntologyService } from '../services/ontologyService';
import { LLMClient } from '../llm/llmClient';

export class NavigatorAgent {
  private protocolEngine: ProtocolEngine = ProtocolEngine;
  private ontologyService: OntologyService;
  private llmClient: LLMClient;

  constructor(ontologyService: OntologyService, llmClient: LLMClient) {
    this.ontologyService = ontologyService;
    this.llmClient = llmClient;
  }

  /**
   * Analyze donor health status and determine next action
   */
  async navigate(finding: Finding, observation: Observation): Promise<NavigatorOutput> {
    // Run protocol analysis
    const protocolResult = this.protocolEngine.analyze(observation);

    // Get protocol details
    const protocol = this.ontologyService.getProtocol(protocolResult.protocolCode);

    // Map protocol action to navigator output
    let nextAction: 'book_visit' | 'wait' | 'lifestyle' | 'urgent';
    let urgencyLevel: number;

    switch (protocolResult.action) {
      case 'emergency':
        nextAction = 'urgent';
        urgencyLevel = 5;
        break;
      case 'urgent':
        nextAction = 'urgent';
        urgencyLevel = 4;
        break;
      case 'refer':
        nextAction = 'book_visit';
        urgencyLevel = 2;
        break;
      case 'defer':
        nextAction = 'lifestyle';
        urgencyLevel = 1;
        break;
      default:
        nextAction = 'wait';
        urgencyLevel = 0;
    }

    // Generate message
    const message = this.generateNavigationMessage(protocolResult, protocol);

    // Get alternatives
    const alternatives = this.generateAlternatives(protocolResult, protocol);

    // Build output
    const output: NavigatorOutput = {
      nextAction,
      timeline: protocolResult.timeline,
      message,
      alternatives,
      urgencyLevel,
      requiresFollowUp: protocolResult.requiresFollowUp,
      followUpIntervalDays: protocolResult.followUpIntervalDays,
    };

    // Find care partner if needed
    if (nextAction === 'book_visit' || nextAction === 'urgent') {
      output.carePartner = {
        id: 'care-center-1',
        name: 'Nearby Medical Center',
        type: 'clinic',
        phone: '+91-1234567890',
        distance_km: 5,
      };
    }

    return output;
  }

  /**
   * Generate human-readable navigation message
   */
  private generateNavigationMessage(
    protocolResult: any,
    protocol: any
  ): string {
    if (!protocol) {
      return protocolResult.details;
    }

    return `${protocol.name}: ${protocolResult.details} Recommended action: ${protocol.recommendedAction}`;
  }

  /**
   * Generate alternative actions
   */
  private generateAlternatives(protocolResult: any, protocol: any): string[] {
    const alternatives: string[] = [];

    if (protocol && protocol.lifestyle && protocol.lifestyle.length > 0) {
      alternatives.push(`Lifestyle modifications: ${protocol.lifestyle.slice(0, 2).join(', ')}`);
    }

    if (protocolResult.action === 'defer') {
      alternatives.push('Home monitoring and follow-up in recommended timeframe');
    }

    if (protocolResult.action === 'refer') {
      alternatives.push('Schedule appointment with care provider');
    }

    return alternatives.length > 0 ? alternatives : ['No additional alternatives'];
  }
}

// Factory function
export function createNavigatorAgent(
  ontologyService: OntologyService,
  llmClient: LLMClient
): NavigatorAgent {
  return new NavigatorAgent(ontologyService, llmClient);
}
