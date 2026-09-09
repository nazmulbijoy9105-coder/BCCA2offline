/**
 * P11-05: Fail-Closed Behavior Verifier.
 *
 * Verifies an ACTUAL engine response rather than simulating a fallback after
 * catching an exception.
 *
 * A fail-closed response must:
 *   - explicitly indicate a blocked/error execution;
 *   - expose a HALTED/ERROR outcome; and
 *   - contain no substantive legal conclusions.
 *
 * This verifier intentionally does not calculate a legal verdict.
 */

export type FailClosedResponseLike = {
  executionStatus?: string;
  outcome?: string;
  stage13?: {
    legalConclusions?: unknown[];
  };
};

export type FailClosedTestResult = {
  behavesCorrectly: boolean;
  reason: string;
};

function hasNoLegalConclusions(response: FailClosedResponseLike): boolean {
  const conclusions = response.stage13?.legalConclusions;
  return !Array.isArray(conclusions) || conclusions.length === 0;
}

/**
 * Verifies that an actual engine response failed closed.
 *
 * The callback must return the actual response produced by the system under
 * the failure condition. No fallback status is supplied or fabricated here.
 */
export function verifyFailClosedBehavior(
  engineEvaluation: () => FailClosedResponseLike,
): FailClosedTestResult {
  let response: FailClosedResponseLike;

  try {
    response = engineEvaluation();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      behavesCorrectly: false,
      reason: `Fail-Closed Violation: engine evaluation escaped with an unhandled exception: ${message}`,
    };
  }

  const executionStatus = response.executionStatus;
  const outcome = response.outcome;

  const statusIsFailClosed =
    executionStatus === "BLOCKED" || executionStatus === "ERROR";

  const outcomeIsFailClosed =
    outcome === "HALTED" || outcome === "ERROR";

  if (!statusIsFailClosed || !outcomeIsFailClosed) {
    return {
      behavesCorrectly: false,
      reason:
        `Fail-Closed Violation: actual response was ` +
        `executionStatus=${String(executionStatus)}, outcome=${String(outcome)}; ` +
        `expected BLOCKED/ERROR with HALTED/ERROR outcome.`,
    };
  }

  if (!hasNoLegalConclusions(response)) {
    return {
      behavesCorrectly: false,
      reason:
        "Fail-Closed Violation: failure response contains substantive legal conclusions.",
    };
  }

  return {
    behavesCorrectly: true,
    reason:
      "Actual engine response failed closed with an explicit blocked/error status, " +
      "a halted/error outcome, and no substantive legal conclusions.",
  };
}

/**
 * Hard fail-closed guard.
 */
export function assertFailClosedBehavior(
  engineEvaluation: () => FailClosedResponseLike,
): void {
  const result = verifyFailClosedBehavior(engineEvaluation);

  if (!result.behavesCorrectly) {
    throw new Error(`Fail-Closed Behavior Violation: ${result.reason}`);
  }
}
