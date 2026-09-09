/**
 * P7-05: Missing Evidence Fail-Closed Gate.
 * 
 * Ensures that if the engine is asked to evaluate a limitation rule 
 * that requires a specific fact (e.g., "Knowledge Date"), but that 
 * fact is entirely missing from the extracted evidence, the engine 
 * fails closed and returns an INDETERMINATE verdict.
 */

export type RequiredFactPredicate = {
  predicate: string;
  object?: string;
};

export type EvaluableFact = {
  predicate: string;
  object?: string;
  verified?: boolean;
};

/**
 * Checks if any of the required predicates are missing from the provided facts.
 * Returns an array of missing predicates.
 */
export function findMissingEvidence(
  requiredPredicates: readonly RequiredFactPredicate[],
  facts: readonly EvaluableFact[]
): readonly RequiredFactPredicate[] {
  const missing: RequiredFactPredicate[] = [];

  for (const req of requiredPredicates) {
    const isPresent = facts.some(fact => {
      if (fact.predicate !== req.predicate) return false;
      if (req.object && fact.object !== req.object) return false;
      // An unverified fact cannot satisfy a required predicate
      if (fact.verified !== true) return false;
      return true;
    });

    if (!isPresent) {
      missing.push(req);
    }
  }

  return missing;
}

/**
 * Hard fail-closed guard. Returns true if any required evidence is missing.
 */
export function hasMissingEvidence(
  requiredPredicates: readonly RequiredFactPredicate[],
  facts: readonly EvaluableFact[]
): boolean {
  return findMissingEvidence(requiredPredicates, facts).length > 0;
}
