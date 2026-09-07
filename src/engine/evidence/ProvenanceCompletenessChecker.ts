/**
 * P7-06: Provenance Completeness.
 * 
 * Ensures that every piece of evidence linked to a fact has a complete
 * provenance chain (e.g., documentId, sourceType, extractionMethod).
 * Incomplete provenance records are flagged for manual review.
 */

export type ProvenanceRecord = {
  documentId?: string;
  segment?: string;
  sourceType?: string;
  extractionMethod?: string;
};

export type FactWithProvenance = {
  factId: string;
  source?: ProvenanceRecord;
};

/**
 * Validates that a fact's provenance record is fully populated.
 * Returns an array of missing required fields.
 */
export function findMissingProvenanceFields(fact: FactWithProvenance): string[] {
  const missing: string[] = [];
  
  if (!fact.source) {
    missing.push("source");
    return missing;
  }

  if (!fact.source.documentId || fact.source.documentId.trim() === "") {
    missing.push("source.documentId");
  }
  if (!fact.source.sourceType || fact.source.sourceType.trim() === "") {
    missing.push("source.sourceType");
  }
  if (!fact.source.extractionMethod || fact.source.extractionMethod.trim() === "") {
    missing.push("source.extractionMethod");
  }

  return missing;
}

/**
 * Hard fail-closed guard. Returns true if any facts lack complete provenance.
 */
export function hasIncompleteProvenance(facts: readonly FactWithProvenance[]): boolean {
  return facts.some(fact => findMissingProvenanceFields(fact).length > 0);
}
