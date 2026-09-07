/**
 * P7-10: Fact Validation Gate.
 * 
 * Ensures that facts explicitly rejected by a validation provider 
 * (or human reviewer) cannot enter the deterministic reasoning pipeline.
 */

export type ValidationStatus = "VALIDATED" | "UNVERIFIED" | "REJECTED";

export type ValidatableFact = {
  factId: string;
  validationStatus: ValidationStatus;
};

/**
 * Filters out facts that have been explicitly rejected by the validation provider.
 */
export function filterValidatedFacts<T extends ValidatableFact>(facts: readonly T[]): readonly T[] {
  return facts.filter(f => f.validationStatus !== "REJECTED");
}

/**
 * Hard fail-closed guard. Returns true if any facts are explicitly rejected.
 */
export function hasRejectedFacts(facts: readonly ValidatableFact[]): boolean {
  return facts.some(f => f.validationStatus === "REJECTED");
}
