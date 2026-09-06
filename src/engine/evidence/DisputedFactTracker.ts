/**
 * P7-02: Disputed Facts Handling.
 * 
 * Detects factual disputes where the same proposition is asserted 
 * with conflicting truth values (e.g., TRUE vs FALSE).
 * Ensures the engine fails closed on unresolved contradictions 
 * rather than hallucinating a resolution.
 */

export type DisputableFact = {
  factId: string;
  propositionId: string;
  truth: "TRUE" | "FALSE" | "UNKNOWN";
  assertedBy: string;
};

export type DisputeRecord = {
  propositionId: string;
  conflictingFacts: DisputableFact[];
};

export function detectDisputedFacts(facts: readonly DisputableFact[]): DisputeRecord[] {
  const grouped = new Map<string, DisputableFact[]>();
  
  for (const fact of facts) {
    const group = grouped.get(fact.propositionId) ?? [];
    group.push(fact);
    grouped.set(fact.propositionId, group);
  }

  const disputes: DisputeRecord[] = [];
  
  for (const [propId, groupFacts] of grouped.entries()) {
    const truthValues = new Set(groupFacts.map(f => f.truth));
    
    // If the same proposition has both TRUE and FALSE assertions, it is disputed
    if (truthValues.has("TRUE") && truthValues.has("FALSE")) {
      disputes.push({ propositionId: propId, conflictingFacts: groupFacts });
    }
  }
  
  return disputes;
}

/**
 * Hard fail-closed guard. Throws an error if unresolved disputes exist.
 */
export function assertNoUnresolvedDisputes(facts: readonly DisputableFact[]): void {
  const disputes = detectDisputedFacts(facts);
  if (disputes.length > 0) {
    const disputeDetails = disputes
      .map(d => `Proposition ${d.propositionId} has conflicting truth values`)
      .join("; ");
    throw new Error(`Illegal State: Unresolved factual disputes detected. ${disputeDetails}`);
  }
}
