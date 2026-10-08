/**
 * KnowledgeGraph - TypeScript client for TraceDrop medical ontology
 * Provides methods for accessing and querying the medical knowledge graph
 * Used by Phase 3 AI layer for contextual message generation and RAG fallback
 */

import fs from 'fs';
import path from 'path';

export interface Concept {
  id: string;
  name: string;
  snomedCode: string;
  definition: string;
  category: string;
  relatedProtocols?: string[];
  symptoms?: string[];
  measurements?: string[];
  referenceRanges?: Record<string, string | number>;
  riskFactors?: string[];
  complications?: string[];
  metadata?: Record<string, string>;
}

export interface Relationship {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number;
  evidence?: string;
}

export interface Protocol {
  id: string;
  name: string;
  category: string;
  applicableCondition: string;
  severity: string;
  recommendedAction: string;
  lifestyle?: string[];
  followUpDays: number;
  escalationThreshold: string;
  monitoringIntervals?: Record<string, string | number>;
  targetPopulation?: string;
  medicationConsideration?: string;
  firstLineAgents?: string[];
}

export interface EmbeddingVector {
  [conceptId: string]: number[];
}

/**
 * KnowledgeGraph class provides access to the medical ontology
 * Loads concepts, relationships, protocols, and embeddings from JSON files
 */
export class KnowledgeGraph {
  private concepts: Map<string, Concept> = new Map();
  private relationships: Relationship[] = [];
  private protocols: Map<string, Protocol> = new Map();
  private embeddings: EmbeddingVector = {};
  private conceptIndex: Map<string, Concept[]> = new Map(); // For keyword search

  constructor(private dataDir: string = path.join(__dirname, '../../data/ontology')) {}

  /**
   * Initialize the knowledge graph by loading all data files
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConcepts();
      await this.loadRelationships();
      await this.loadProtocols();
      await this.loadEmbeddings();
      this.buildSearchIndex();
      console.log('Knowledge graph initialized successfully');
    } catch (error) {
      console.error('Error initializing knowledge graph:', error);
      throw error;
    }
  }

  /**
   * Load concepts from concepts.json
   */
  private async loadConcepts(): Promise<void> {
    const filePath = path.join(this.dataDir, 'concepts.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const conceptsList: Concept[] = JSON.parse(data);
    conceptsList.forEach(concept => {
      this.concepts.set(concept.id, concept);
    });
    console.log(`Loaded ${this.concepts.size} concepts`);
  }

  /**
   * Load relationships from relationships.json
   */
  private async loadRelationships(): Promise<void> {
    const filePath = path.join(this.dataDir, 'relationships.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    this.relationships = JSON.parse(data);
    console.log(`Loaded ${this.relationships.length} relationships`);
  }

  /**
   * Load protocols from protocols.json
   */
  private async loadProtocols(): Promise<void> {
    const filePath = path.join(this.dataDir, 'protocols.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const protocolsList: Protocol[] = JSON.parse(data);
    protocolsList.forEach(protocol => {
      this.protocols.set(protocol.id, protocol);
    });
    console.log(`Loaded ${this.protocols.size} protocols`);
  }

  /**
   * Load embeddings from embeddings.json
   */
  private async loadEmbeddings(): Promise<void> {
    const filePath = path.join(this.dataDir, 'embeddings.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    this.embeddings = JSON.parse(data);
    console.log(`Loaded embeddings for ${Object.keys(this.embeddings).length} concepts`);
  }

  /**
   * Build search index for keyword-based concept lookup
   */
  private buildSearchIndex(): void {
    this.concepts.forEach((concept) => {
      const keywords = [
        concept.name.toLowerCase(),
        concept.definition.toLowerCase(),
        concept.category.toLowerCase(),
        ...(concept.symptoms || []),
        ...(concept.riskFactors || []),
        ...(concept.complications || [])
      ];

      keywords.forEach(keyword => {
        if (!this.conceptIndex.has(keyword)) {
          this.conceptIndex.set(keyword, []);
        }
        this.conceptIndex.get(keyword)!.push(concept);
      });
    });
  }

  /**
   * Get a single concept by ID
   */
  getConcept(conceptId: string): Concept | undefined {
    return this.concepts.get(conceptId);
  }

  /**
   * Get all concepts in a specific category
   */
  getConceptsByCategory(category: string): Concept[] {
    const result: Concept[] = [];
    this.concepts.forEach(concept => {
      if (concept.category === category) {
        result.push(concept);
      }
    });
    return result;
  }

  /**
   * Search concepts by keyword
   */
  searchConcepts(keyword: string): Concept[] {
    const normalized = keyword.toLowerCase();
    const results: Concept[] = [];
    const seen = new Set<string>();

    // Search in index
    this.conceptIndex.forEach((concepts, indexKey) => {
      if (indexKey.includes(normalized)) {
        concepts.forEach(concept => {
          if (!seen.has(concept.id)) {
            results.push(concept);
            seen.add(concept.id);
          }
        });
      }
    });

    return results;
  }

  /**
   * Get related concepts for a given concept
   * Returns concepts with relationships to the target concept
   */
  getRelated(
    conceptId: string,
    relationshipType?: string,
    maxDepth: number = 1
  ): Map<string, { concept: Concept; relationship: Relationship; depth: number }> {
    const related = new Map<string, { concept: Concept; relationship: Relationship; depth: number }>();
    const visited = new Set<string>();

    const explore = (currentId: string, depth: number) => {
      if (depth > maxDepth || visited.has(currentId)) return;
      visited.add(currentId);

      this.relationships.forEach(rel => {
        if (rel.sourceId === currentId) {
          if (!relationshipType || rel.relationshipType === relationshipType) {
            const targetConcept = this.concepts.get(rel.targetId);
            if (targetConcept && !related.has(rel.targetId)) {
              related.set(rel.targetId, {
                concept: targetConcept,
                relationship: rel,
                depth
              });
            }
          }
        }

        if (rel.targetId === currentId) {
          if (!relationshipType || rel.relationshipType === relationshipType) {
            const sourceConcept = this.concepts.get(rel.sourceId);
            if (sourceConcept && !related.has(rel.sourceId)) {
              related.set(rel.sourceId, {
                concept: sourceConcept,
                relationship: rel,
                depth
              });
            }
          }
        }
      });

      if (depth < maxDepth) {
        related.forEach(entry => {
          if (!visited.has(entry.concept.id)) {
            explore(entry.concept.id, depth + 1);
          }
        });
      }
    };

    explore(conceptId, 0);
    visited.delete(conceptId);
    return related;
  }

  /**
   * Get embedding vector for a concept
   */
  getEmbedding(conceptId: string): number[] | undefined {
    return this.embeddings[conceptId];
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Find similar concepts based on embedding similarity
   */
  findSimilar(embedding: number[], topK: number = 5): Array<{ conceptId: string; similarity: number }> {
    const similarities: Array<{ conceptId: string; similarity: number }> = [];

    Object.entries(this.embeddings).forEach(([conceptId, vector]) => {
      const similarity = this.cosineSimilarity(embedding, vector);
      similarities.push({ conceptId, similarity });
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Get protocols for a concept
   */
  getProtocols(conceptId: string): Protocol[] {
    const concept = this.concepts.get(conceptId);
    if (!concept || !concept.relatedProtocols) return [];

    return concept.relatedProtocols
      .map(protocolId => this.protocols.get(protocolId))
      .filter((p): p is Protocol => p !== undefined);
  }

  /**
   * Get protocol by ID
   */
  getProtocol(protocolId: string): Protocol | undefined {
    return this.protocols.get(protocolId);
  }

  /**
   * Get protocols by category
   */
  getProtocolsByCategory(category: string): Protocol[] {
    const result: Protocol[] = [];
    this.protocols.forEach(protocol => {
      if (protocol.category === category) {
        result.push(protocol);
      }
    });
    return result;
  }

  /**
   * Build context for RAG - get relevant ontology information for message generation
   * Used by AI layer to provide grounded context
   */
  async getContextForMessage(conceptIds: string[], maxRelatedDepth: number = 2): Promise<string> {
    const contextParts: string[] = [];

    for (const conceptId of conceptIds) {
      const concept = this.concepts.get(conceptId);
      if (!concept) continue;

      // Add concept definition
      contextParts.push(`Concept: ${concept.name}`);
      contextParts.push(`Definition: ${concept.definition}`);
      contextParts.push(`Category: ${concept.category}`);

      // Add reference ranges if available
      if (concept.referenceRanges && Object.keys(concept.referenceRanges).length > 0) {
        contextParts.push(`Reference Ranges: ${JSON.stringify(concept.referenceRanges)}`);
      }

      // Add complications
      if (concept.complications && concept.complications.length > 0) {
        contextParts.push(`Complications: ${concept.complications.join(', ')}`);
      }

      // Add related protocols
      const protocols = this.getProtocols(conceptId);
      if (protocols.length > 0) {
        contextParts.push(`Related Protocols:`);
        protocols.forEach(p => {
          contextParts.push(`  - ${p.name}: ${p.applicableCondition}`);
        });
      }

      // Add related concepts
      const relatedConcepts = this.getRelated(conceptId, undefined, maxRelatedDepth);
      if (relatedConcepts.size > 0) {
        contextParts.push(`Related Concepts:`);
        relatedConcepts.forEach(entry => {
          contextParts.push(
            `  - ${entry.concept.name} (${entry.relationship.relationshipType}, strength: ${entry.relationship.strength})`
          );
        });
      }

      contextParts.push('---');
    }

    return contextParts.join('\n');
  }

  /**
   * Validate the ontology for consistency
   * Checks for orphaned nodes and broken references
   */
  validateOntology(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for orphaned concepts
    this.concepts.forEach((concept, conceptId) => {
      const hasRelationship = this.relationships.some(
        rel => rel.sourceId === conceptId || rel.targetId === conceptId
      );
      if (!hasRelationship) {
        issues.push(`Orphaned concept: ${conceptId} (${concept.name})`);
      }
    });

    // Check for broken protocol references
    this.concepts.forEach((concept, conceptId) => {
      if (concept.relatedProtocols) {
        concept.relatedProtocols.forEach(protocolId => {
          if (!this.protocols.has(protocolId)) {
            issues.push(`Broken protocol reference in ${conceptId}: ${protocolId}`);
          }
        });
      }
    });

    // Check for broken relationship references
    this.relationships.forEach((rel, index) => {
      if (!this.concepts.has(rel.sourceId)) {
        issues.push(`Broken source reference in relationship ${index}: ${rel.sourceId}`);
      }
      if (!this.concepts.has(rel.targetId)) {
        issues.push(`Broken target reference in relationship ${index}: ${rel.targetId}`);
      }
    });

    // Check embedding dimensions
    Object.entries(this.embeddings).forEach(([conceptId, vector]) => {
      if (vector.length !== 384) {
        issues.push(`Invalid embedding dimension for ${conceptId}: ${vector.length} (expected 384)`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get statistics about the knowledge graph
   */
  getStatistics() {
    return {
      totalConcepts: this.concepts.size,
      totalRelationships: this.relationships.length,
      totalProtocols: this.protocols.size,
      conceptsByCategory: this.getCategoryDistribution(),
      relationshipTypes: this.getRelationshipTypeDistribution()
    };
  }

  /**
   * Get distribution of concepts by category
   */
  private getCategoryDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.concepts.forEach(concept => {
      distribution[concept.category] = (distribution[concept.category] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get distribution of relationship types
   */
  private getRelationshipTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.relationships.forEach(rel => {
      distribution[rel.relationshipType] = (distribution[rel.relationshipType] || 0) + 1;
    });
    return distribution;
  }
}

// Export singleton instance
export const knowledgeGraph = new KnowledgeGraph();
