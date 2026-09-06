import { DisputableFact, detectDisputedFacts } from "./DisputedFactTracker";

/**
 * P7-03: Contradiction Disclosure.
 * 
 * Ensures that when factual disputes are detected, they are explicitly
 * formatted into a human-readable disclosure string.
 * Prevents the engine from hiding contradictions in the final output.
 */

export function formatContradictionDisclosure(facts: readonly DisputableFact[]): string | null {
  const disputes = detectDisputedFacts(facts);
  
  if (disputes.length === 0) {
    return null;
  }

  const disputeMessages = disputes.map(d => {
    const trueAssertions = d.conflictingFacts.filter(f => f.truth === "TRUE").map(f => f.assertedBy);
    const falseAssertions = d.conflictingFacts.filter(f => f.truth === "FALSE").map(f => f.assertedBy);
    
    return `Dispute on Proposition ${d.propositionId}: Asserted TRUE by [${trueAssertions.join(", ")}] but FALSE by [${falseAssertions.join(", ")}].`;
  });

  return `Factual Contradictions Detected:\n${disputeMessages.join("\n")}`;
}
