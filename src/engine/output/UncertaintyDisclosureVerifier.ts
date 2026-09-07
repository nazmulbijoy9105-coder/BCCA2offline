/**
 * P10-05: Uncertainty Disclosure Verifier.
 * 
 * Ensures the legal memo explicitly discloses any INDETERMINATE verdicts 
 * produced by the engine. Prevents the LLM from hiding uncertainty or 
 * fabricating confident conclusions where the engine failed closed.
 */

export type EngineVerdict = {
  verdictId: string;
  status: "BARRED" | "NOT_BARRED" | "INDETERMINATE";
};

export type MemoDisclosure = {
  disclosureType: "UNCERTAINTY_DISCLOSURE";
  coversVerdictId: string;
};

export type DisclosureResult = {
  isValid: boolean;
  missingDisclosures: string[];
};

/**
 * Validates that all INDETERMINATE verdicts are covered by a disclosure.
 */
export function verifyUncertaintyDisclosure(
  verdicts: readonly EngineVerdict[],
  disclosures: readonly MemoDisclosure[]
): DisclosureResult {
  const indeterminateVerdicts = verdicts.filter(v => v.status === "INDETERMINATE");
  const coveredIds = new Set(disclosures.map(d => d.coversVerdictId));
  const missingDisclosures: string[] = [];

  for (const verdict of indeterminateVerdicts) {
    if (!coveredIds.has(verdict.verdictId)) {
      missingDisclosures.push(verdict.verdictId);
    }
  }

  return {
    isValid: missingDisclosures.length === 0,
    missingDisclosures,
  };
}

/**
 * Hard fail-closed guard. Throws an error if INDETERMINATE verdicts are not disclosed.
 */
export function assertUncertaintyDisclosure(
  verdicts: readonly EngineVerdict[],
  disclosures: readonly MemoDisclosure[]
): void {
  const result = verifyUncertaintyDisclosure(verdicts, disclosures);
  if (!result.isValid) {
    throw new Error(`Uncertainty Disclosure Violation: The following INDETERMINATE verdicts were not disclosed in the memo: [${result.missingDisclosures.join(", ")}]`);
  }
}
