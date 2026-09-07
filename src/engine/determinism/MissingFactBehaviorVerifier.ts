/**
 * P11-03: Missing-Fact Behavior Verifier.
 * 
 * Verifies that the engine deterministically degrades to INDETERMINATE
 * when required facts are missing, rather than guessing or hallucinating.
 */

export type EngineEvaluationResult = {
  status: "BARRED" | "NOT_BARRED" | "INDETERMINATE";
  errors: string[];
};

export type MissingFactTestResult = {
  behavesCorrectly: boolean;
  reason: string;
};

/**
 * Executes an engine evaluation with missing facts and verifies the output.
 * The engine MUST return INDETERMINATE and include the missing fact in errors.
 */
export function verifyMissingFactBehavior(
  engineEvaluation: () => EngineEvaluationResult,
  expectedMissingFactName: string
): MissingFactTestResult {
  const result = engineEvaluation();

  if (result.status !== "INDETERMINATE") {
    return {
      behavesCorrectly: false,
      reason: `Expected INDETERMINATE status for missing fact, but got ${result.status}.`
    };
  }

  const mentionsMissingFact = result.errors.some(err =>
    err.toLowerCase().includes(expectedMissingFactName.toLowerCase())
  );

  if (!mentionsMissingFact) {
    return {
      behavesCorrectly: false,
      reason: `Expected errors to mention missing fact "${expectedMissingFactName}", but got: [${result.errors.join(", ")}]`
    };
  }

  return {
    behavesCorrectly: true,
    reason: "Engine correctly degraded to INDETERMINATE with explicit missing fact error."
  };
}

/**
 * Hard fail-closed guard. Throws an error if the engine does not handle missing facts correctly.
 */
export function assertMissingFactBehavior(
  engineEvaluation: () => EngineEvaluationResult,
  expectedMissingFactName: string
): void {
  const result = verifyMissingFactBehavior(engineEvaluation, expectedMissingFactName);
  if (!result.behavesCorrectly) {
    throw new Error(`Missing-Fact Behavior Violation: ${result.reason}`);
  }
}
