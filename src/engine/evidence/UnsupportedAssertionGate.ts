/**
 * P7-04: Unsupported Assertions Blocking.
 * 
 * Ensures the engine never makes a legal conclusion based on an assertion 
 * that lacks supporting evidence. Filters out or blocks facts marked as 
 * UNSUPPORTED from entering the final reasoning pipeline.
 */

export type AssertableFact = {
  factId: string;
  propositionId: string;
  truth: "TRUE" | "FALSE" | "UNKNOWN";
  supportStatus: "SUPPORTED" | "UNSUPPORTED" | "UNVERIFIED";
};

/**
 * Returns only facts that have verifiable support.
 */
export function filterSupportedAssertions<T extends AssertableFact>(facts: readonly T[]): readonly T[] {
  return facts.filter(f => f.supportStatus !== "UNSUPPORTED");
}

/**
 * Hard fail-closed guard. Returns true if any unsupported assertions exist 
 * in the provided fact set, indicating the engine should halt the reasoning 
 * pipeline for those facts.
 */
export function hasUnsupportedAssertions(facts: readonly AssertableFact[]): boolean {
  return facts.some(f => f.supportStatus === "UNSUPPORTED");
}
