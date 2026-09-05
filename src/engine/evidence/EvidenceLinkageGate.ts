/**
 * P7-01: Evidence Linkage Gate.
 * 
 * Ensures every atomic fact extracted by the engine is explicitly linked 
 * to a verifiable source document segment. Prevents "ghost facts" from 
 * entering the deterministic reasoning pipeline.
 */

export type FactSource = {
  documentId: string;
  segment?: string;
  paragraph?: number;
  sourceType: string;
  extractionMethod: string;
};

export type LinkableFact = {
  factId: string;
  source?: FactSource;
  provenanceAssertions?: string[];
};

export function isFactSupported(fact: LinkableFact): boolean {
  // A fact is only supported if it has a formal source object
  // with a valid documentId.
  if (!fact.source || !fact.source.documentId || fact.source.documentId.trim() === "") {
    return false;
  }
  return true;
}

/**
 * Hard fail-closed guard. Throws an error if an unsupported fact is used.
 */
export function assertFactHasEvidence(fact: LinkableFact): void {
  if (!isFactSupported(fact)) {
    throw new Error(`Illegal State: Fact ${fact.factId} lacks verifiable evidence linkage.`);
  }
}

/**
 * Filters an array of facts, returning only those with verifiable evidence.
 */
export function filterSupportedFacts<T extends LinkableFact>(facts: readonly T[]): readonly T[] {
  return facts.filter(isFactSupported);
}
