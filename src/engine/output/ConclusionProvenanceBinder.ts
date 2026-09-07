/**
 * P10-03: Conclusion Provenance Binding.
 * 
 * Ensures that every legal conclusion generated in the memo is explicitly 
 * tied to a deterministic engine output (e.g., a specific rule ID or fact ID).
 * Prevents the LLM from inventing conclusions without a verifiable basis.
 */

export type ProvenanceLink = {
  conclusionId: string;
  conclusionText: string;
  sourceRuleId?: string;
  sourceFactId?: string;
};

export type ProvenanceBindingResult = {
  isValid: boolean;
  unboundConclusions: string[];
};

/**
 * Validates that all conclusions have at least one source (rule or fact).
 */
export function validateConclusionProvenance(
  links: readonly ProvenanceLink[]
): ProvenanceBindingResult {
  const unboundConclusions: string[] = [];

  for (const link of links) {
    if (!link.sourceRuleId && !link.sourceFactId) {
      unboundConclusions.push(link.conclusionId);
    }
  }

  return {
    isValid: unboundConclusions.length === 0,
    unboundConclusions,
  };
}

/**
 * Hard fail-closed guard. Throws an error if any conclusions lack provenance.
 */
export function assertConclusionProvenance(
  links: readonly ProvenanceLink[]
): void {
  const result = validateConclusionProvenance(links);
  if (!result.isValid) {
    throw new Error(`Conclusion Provenance Violation: The following conclusions lack deterministic source mapping: [${result.unboundConclusions.join(", ")}]`);
  }
}
