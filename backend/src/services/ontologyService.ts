/**
 * Ontology Service - Knowledge Graph Integration
 * Loads and serves medical concepts, protocols, and lifestyle recommendations
 */

import * as fs from 'fs';
import * as path from 'path';
import { Concept, Protocol, LifestyleIntervention } from '../types/agents';

export class OntologyService {
  private concepts: Map<string, Concept> = new Map();
  private protocols: Map<string, Protocol> = new Map();
  private interventions: Map<string, LifestyleIntervention> = new Map();

  constructor(ontologyPath: string = './data/ontology') {
    this.loadOntologyData(ontologyPath);
  }

  /**
   * Get concept by ID
   */
  getConcept(id: string): Concept | undefined {
    return this.concepts.get(id);
  }

  /**
   * Get protocol by ID
   */
  getProtocol(id: string): Protocol | undefined {
    return this.protocols.get(id);
  }

  /**
   * Get lifestyle interventions for condition
   */
  getLifestyleRecommendations(conditionId: string): LifestyleIntervention[] {
    const results: LifestyleIntervention[] = [];
    for (const [, intervention] of this.interventions) {
      if (intervention.applicableConditions.includes(conditionId)) {
        results.push(intervention);
      }
    }
    return results;
  }

  /**
   * Get related concepts
   */
  getRelatedConcepts(conceptId: string): Concept[] {
    const concept = this.concepts.get(conceptId);
    if (!concept) return [];

    const results: Concept[] = [];
    for (const protocolId of concept.relatedProtocols) {
      const protocol = this.protocols.get(protocolId);
      if (protocol) {
        // Find concepts related to this protocol
        for (const [, c] of this.concepts) {
          if (c.relatedProtocols.includes(protocolId) && c.id !== conceptId) {
            results.push(c);
          }
        }
      }
    }
    return results;
  }

  /**
   * Build context for LLM prompting
   */
  getContextForMessage(conceptIds: string[]): string {
    let context = 'Medical Context:\n';

    for (const id of conceptIds) {
      const concept = this.concepts.get(id);
      if (concept) {
        context += `\n${concept.name}:\n`;
        context += `- Definition: ${concept.definition}\n`;
        context += `- Severity: ${concept.metadata.severity || 'variable'}\n`;

        // Add protocol info
        for (const protocolId of concept.relatedProtocols.slice(0, 2)) {
          const protocol = this.protocols.get(protocolId);
          if (protocol) {
            context += `- Protocol ${protocolId}: ${protocol.recommendedAction}\n`;
          }
        }

        // Add lifestyle info
        const interventions = this.getLifestyleRecommendations(id);
        if (interventions.length > 0) {
          context += `- Lifestyle: ${interventions.map(i => i.recommendation).join(', ')}\n`;
        }
      }
    }

    return context;
  }

  /**
   * Load ontology from JSON files
   */
  private loadOntologyData(ontologyPath: string): void {
    try {
      // Load concepts
      const conceptsFile = path.join(ontologyPath, 'concepts.json');
      if (fs.existsSync(conceptsFile)) {
        const conceptsData = JSON.parse(fs.readFileSync(conceptsFile, 'utf-8'));
        for (const concept of conceptsData) {
          this.concepts.set(concept.id, concept);
        }
      }

      // Load protocols
      const protocolsFile = path.join(ontologyPath, 'protocols.json');
      if (fs.existsSync(protocolsFile)) {
        const protocolsData = JSON.parse(fs.readFileSync(protocolsFile, 'utf-8'));
        for (const protocol of protocolsData) {
          this.protocols.set(protocol.id, protocol);
        }
      }

      // Load lifestyle recommendations
      const interventionsFile = path.join(ontologyPath, 'lifestyle-recommendations.json');
      if (fs.existsSync(interventionsFile)) {
        const interventionsData = JSON.parse(fs.readFileSync(interventionsFile, 'utf-8'));
        for (const intervention of interventionsData) {
          this.interventions.set(intervention.id, intervention);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not load ontology data:', error);
    }
  }

  /**
   * Search concepts by keyword
   */
  searchConcepts(keyword: string): Concept[] {
    const results: Concept[] = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const [, concept] of this.concepts) {
      if (
        concept.name.toLowerCase().includes(lowerKeyword) ||
        concept.definition.toLowerCase().includes(lowerKeyword) ||
        concept.symptoms.some(s => s.toLowerCase().includes(lowerKeyword))
      ) {
        results.push(concept);
      }
    }

    return results;
  }

  /**
   * Get all concepts in category
   */
  getConceptsByCategory(category: string): Concept[] {
    const results: Concept[] = [];
    for (const [, concept] of this.concepts) {
      if (concept.category === category) {
        results.push(concept);
      }
    }
    return results;
  }
}

// Singleton instance
let ontologyService: OntologyService | null = null;

export function getOntologyService(ontologyPath?: string): OntologyService {
  if (!ontologyService) {
    ontologyService = new OntologyService(ontologyPath);
  }
  return ontologyService;
}
