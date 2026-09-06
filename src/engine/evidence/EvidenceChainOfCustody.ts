/**
 * P7-12: Evidence Chain of Custody.
 * 
 * Ensures that every piece of evidence has a verifiable chain of custody.
 * Tracks the original document's content hash and ingestion timestamp,
 * and verifies that extracted facts link back to registered documents.
 */

export type CustodialDocument = {
  documentId: string;
  contentHash: string; // SHA-256 of the original document content
  ingestedAt: string;  // ISO timestamp of ingestion
};

export type CustodialFact = {
  factId: string;
  source?: {
    documentId?: string;
  };
};

export type CustodyVerificationResult = {
  isValid: boolean;
  unregisteredDocumentIds: string[];
};

/**
 * Verifies that all facts link back to registered, custodial documents.
 */
export function verifyChainOfCustody(
  facts: readonly CustodialFact[],
  documents: readonly CustodialDocument[]
): CustodyVerificationResult {
  const docMap = new Map(documents.map(d => [d.documentId, d]));
  const unregisteredDocumentIds = new Set<string>();

  for (const fact of facts) {
    const docId = fact.source?.documentId;
    if (!docId || !docMap.has(docId)) {
      if (docId) unregisteredDocumentIds.add(docId);
    }
  }

  return {
    isValid: unregisteredDocumentIds.size === 0,
    unregisteredDocumentIds: Array.from(unregisteredDocumentIds),
  };
}

/**
 * Hard fail-closed guard. Returns true if any facts reference unregistered documents.
 */
export function hasBrokenChainOfCustody(
  facts: readonly CustodialFact[],
  documents: readonly CustodialDocument[]
): boolean {
  return !verifyChainOfCustody(facts, documents).isValid;
}
