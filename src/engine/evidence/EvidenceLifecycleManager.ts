/**
 * P7-11: Evidence Lifecycle Management.
 * 
 * Ensures that stale or superseded evidence cannot be used in the 
 * current reasoning pipeline. If a document is marked as superseded 
 * or revoked, any facts linked to it are flagged for removal.
 */

export type DocumentStatus = "ACTIVE" | "SUPERSEDED" | "REVOKED" | "DELETED";

export type DocumentRecord = {
  documentId: string;
  status: DocumentStatus;
};

export type LifecycleFact = {
  factId: string;
  source?: {
    documentId?: string;
  };
};

/**
 * Filters out facts whose source documents are no longer active.
 */
export function filterActiveFacts<T extends LifecycleFact>(
  facts: readonly T[],
  documents: readonly DocumentRecord[]
): readonly T[] {
  const activeDocIds = new Set(
    documents
      .filter(d => d.status === "ACTIVE")
      .map(d => d.documentId)
  );

  return facts.filter(fact => {
    if (!fact.source || !fact.source.documentId) return false;
    return activeDocIds.has(fact.source.documentId);
  });
}

/**
 * Hard fail-closed guard. Returns true if any facts rely on inactive documents.
 */
export function hasStaleEvidence(
  facts: readonly LifecycleFact[],
  documents: readonly DocumentRecord[]
): boolean {
  const activeDocIds = new Set(
    documents
      .filter(d => d.status === "ACTIVE")
      .map(d => d.documentId)
  );

  return facts.some(fact => {
    if (!fact.source || !fact.source.documentId) return true; // No source is stale
    return !activeDocIds.has(fact.source.documentId);
  });
}
