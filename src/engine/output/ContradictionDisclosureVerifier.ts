/**
 * P10-06: Contradiction Disclosure Verifier.
 * 
 * Ensures the legal memo explicitly discloses any unresolved factual 
 * disputes (contradictions) detected by the engine. Prevents the LLM 
 * from hiding disputes and presenting a one-sided narrative.
 */

export type EngineDispute = {
  disputeId: string;
  propositionId: string;
};

export type MemoContradictionDisclosure = {
  disclosureType: "CONTRADICTION_DISCLOSURE";
  coversDisputeId: string;
};

export type ContradictionDisclosureResult = {
  isValid: boolean;
  missingDisclosures: string[];
};

/**
 * Validates that all detected disputes are covered by a disclosure.
 */
export function verifyContradictionDisclosure(
  disputes: readonly EngineDispute[],
  disclosures: readonly MemoContradictionDisclosure[]
): ContradictionDisclosureResult {
  const coveredIds = new Set(disclosures.map(d => d.coversDisputeId));
  const missingDisclosures: string[] = [];

  for (const dispute of disputes) {
    if (!coveredIds.has(dispute.disputeId)) {
      missingDisclosures.push(dispute.disputeId);
    }
  }

  return {
    isValid: missingDisclosures.length === 0,
    missingDisclosures,
  };
}

/**
 * Hard fail-closed guard. Throws an error if detected disputes are not disclosed.
 */
export function assertContradictionDisclosure(
  disputes: readonly EngineDispute[],
  disclosures: readonly MemoContradictionDisclosure[]
): void {
  const result = verifyContradictionDisclosure(disputes, disclosures);
  if (!result.isValid) {
    throw new Error(`Contradiction Disclosure Violation: The following factual disputes were not disclosed in the memo: [${result.missingDisclosures.join(", ")}]`);
  }
}
