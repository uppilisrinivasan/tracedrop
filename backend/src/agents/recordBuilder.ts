/**
 * Record Builder Agent - Multimodal Input Processing
 * Handles text, voice, and image input to create observations and findings
 */

import { RecordInput, RecordOutput, Observation, Finding } from '../types/agents';
import { ProtocolEngine } from '../utils/protocolEngine';
import { LLMClient } from '../llm/llmClient';

export class RecordBuilderAgent {
  private protocolEngine: ProtocolEngine = ProtocolEngine;
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Process multimodal input and create observation/finding
   */
  async processRecord(input: RecordInput): Promise<RecordOutput> {
    // Step 1: Parse input
    let text: string;

    if (input.type === 'text') {
      text = typeof input.input === 'string' ? input.input : input.input.toString();
    } else if (input.type === 'voice') {
      text = await this.transcribeVoice(input);
    } else if (input.type === 'image') {
      text = await this.extractFromImage(input);
    } else {
      throw new Error(`Unsupported input type: ${input.type}`);
    }

    // Step 2: Extract vitals from text
    const extractedData = await this.extractVitals(text);

    // Step 3: Create Observation
    const observation = this.createObservation(input.donorId, extractedData, input);

    // Step 4: Run protocol analysis
    const protocolResult = this.protocolEngine.analyze(observation);

    // Step 5: Create Finding if warranted
    let finding: Finding | undefined;
    if (protocolResult.action !== 'wait') {
      finding = this.createFinding(input.donorId, observation, protocolResult);
    }

    return {
      observationId: observation.id,
      findingId: finding?.id,
      message: this.generateResponseMessage(protocolResult),
      notes: this.generateNotes(protocolResult),
      urgent: protocolResult.action === 'emergency',
      extractedData,
    };
  }

  /**
   * Transcribe voice input
   */
  private async transcribeVoice(input: RecordInput): Promise<string> {
    // In production, use speech-to-text service
    if (typeof input.input === 'string') {
      return input.input;
    }
    throw new Error('Voice transcription not yet implemented');
  }

  /**
   * Extract vitals from image
   */
  private async extractFromImage(input: RecordInput): Promise<string> {
    // In production, use OCR service
    if (typeof input.input === 'string') {
      return input.input;
    }
    throw new Error('Image processing not yet implemented');
  }

  /**
   * Extract vitals from text using LLM
   */
  private async extractVitals(text: string): Promise<Record<string, string>> {
    try {
      return await this.llmClient.extractVitals(text);
    } catch {
      // Fallback to regex extraction
      return this.extractVitalsRegex(text);
    }
  }

  /**
   * Regex-based fallback for vital extraction
   */
  private extractVitalsRegex(text: string): Record<string, string> {
    const data: Record<string, string> = {};

    // Blood Pressure
    const bpMatch = text.match(/BP\s*:?\s*(\d+)\s*\/\s*(\d+)/i);
    if (bpMatch) {
      data['BP'] = `${bpMatch[1]}/${bpMatch[2]}`;
    }

    // Hemoglobin
    const hbMatch = text.match(/Hb\s*:?\s*([\d.]+)/i);
    if (hbMatch) {
      data['Hb'] = hbMatch[1];
    }

    // Blood Sugar
    const fbsMatch = text.match(/(?:FBS|glucose|sugar)\s*:?\s*(\d+)/i);
    if (fbsMatch) {
      data['FBS'] = fbsMatch[1];
    }

    return data;
  }

  /**
   * Create Observation record
   */
  private createObservation(
    donorId: string,
    extractedData: Record<string, string>,
    input: RecordInput
  ): Observation {
    // Extract first vital as primary observation
    const [type, value] = Object.entries(extractedData)[0] || ['BP', '120/80'];

    return {
      id: `obs_${Date.now()}`,
      donorId,
      type: type as any,
      value,
      unit: this.getUnit(type),
      recordedAt: input.recordedAt || new Date().toISOString(),
      source: (input.source as any) || 'app',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create Finding record
   */
  private createFinding(
    donorId: string,
    observation: Observation,
    protocolResult: any
  ): Finding {
    return {
      id: `find_${Date.now()}`,
      donorId,
      category: protocolResult.protocolCode,
      sourceObservationId: observation.id,
      trend: 'first_time',
      status: 'active',
      description: protocolResult.details,
      severity: protocolResult.severity,
      protocolCode: protocolResult.protocolCode,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get unit for observation type
   */
  private getUnit(type: string): string {
    const units: Record<string, string> = {
      BP: 'mmHg',
      Hb: 'g/dL',
      FBS: 'mg/dL',
      HR: 'bpm',
      RR: 'breaths/min',
      BMI: 'kg/m2',
    };
    return units[type] || 'unit';
  }

  /**
   * Generate response message
   */
  private generateResponseMessage(protocolResult: any): string {
    switch (protocolResult.action) {
      case 'emergency':
        return 'URGENT: Seek immediate medical attention.';
      case 'urgent':
        return 'High priority: Schedule urgent appointment.';
      case 'refer':
        return 'Please schedule an appointment with a healthcare provider.';
      case 'defer':
        return 'Continue monitoring. See you at next donation.';
      default:
        return 'Thank you for the information. Everything looks good.';
    }
  }

  /**
   * Generate notes
   */
  private generateNotes(protocolResult: any): string {
    return `Protocol: ${protocolResult.protocolCode}, Timeline: ${protocolResult.timeline}`;
  }
}

// Factory function
export function createRecordBuilderAgent(llmClient: LLMClient): RecordBuilderAgent {
  return new RecordBuilderAgent(llmClient);
}
