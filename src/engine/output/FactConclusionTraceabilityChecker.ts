/**
 * P10-04: Fact-to-Conclusion Traceability.
 * 
 * Ensures that every fact referenced in the memo's arguments actually 
 * exists in the engine's verified evidence pool. Prevents the LLM from 
 * hallucinating facts or using rejected evidence.
 */

export type TraceabilityLink = {
  conclusionId: string;
  referencedFactIds: readonly string[];
};

export type TraceabilityResult = {
  isValid: boolean;
  untraceableFacts: string[];
};

/**
 * Validates that all referenced facts exist in the provided pool of valid fact IDs.
 */
export function checkFactConclusionTraceability(
  links: readonly TraceabilityLink[],
  validFactIds: readonly string[]
): TraceabilityResult {
  const validFactSet = new Set(validFactIds);
  const untraceableFacts = new Set<string>();

  for (const link of links) {
    for (const factId of link.referencedFactIds) {
      if (!validFactSet.has(factId)) {
        untraceableFacts.add(factId);
      }
    }
  }

  return {
    isValid: untraceableFacts.size === 0,
    untraceableFacts: Array.from(untraceableFacts),
  };
}

/**
 * Hard fail-closed guard. Throws an error if any referenced facts are untraceable.
 */
export function assertFactConclusionTraceability(
  links: readonly TraceabilityLink[],
  validFactIds: readonly string[]
): void {
  const result = checkFactConclusionTraceability(links, validFactIds);
  if (!result.isValid) {
    throw new Error(`Fact-to-Conclusion Traceability Violation: The following referenced facts do not exist in the verified evidence pool: [${result.untraceableFacts.join(", ")}]`);
  }
}
