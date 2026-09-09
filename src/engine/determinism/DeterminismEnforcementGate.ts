import { verifyDeterministicExecution } from "./DeterministicExecutionVerifier";
import { verifyRepeatability } from "./RepeatabilityVerifier";
import {
  verifyFailClosedBehavior,
  type FailClosedResponseLike,
} from "./FailClosedBehaviorVerifier";

/**
 * P11-09: Determinism Enforcement Gate.
 *
 * Single source of truth for determinism certification. Combines execution
 * hash, repeatability, and optional actual fail-closed response verification.
 *
 * Fails closed if any determinism defect is detected.
 */

export type DeterminismDefect = {
  category: "EXECUTION_HASH" | "REPEATABILITY" | "FAIL_CLOSED";
  description: string;
};

export type DeterminismEvaluationResult = {
  isCertified: boolean;
  defects: DeterminismDefect[];
};

export function enforceDeterminism<T>(
  fn: () => T,
  failClosedEvaluation?: () => FailClosedResponseLike,
  runs: number = 5
): DeterminismEvaluationResult {
  const defects: DeterminismDefect[] = [];

  // 1. Execution Hash Check
  const execResult = verifyDeterministicExecution(fn, runs);

  if (!execResult.isDeterministic) {
    defects.push({
      category: "EXECUTION_HASH",
      description: `Output hash varied across ${runs} runs.`,
    });
  }

  // 2. Repeatability Check
  const repeatResult = verifyRepeatability(fn, runs);

  if (!repeatResult.isRepeatable) {
    defects.push({
      category: "REPEATABILITY",
      description: `Canonical output equality failed across ${runs} runs.`,
    });
  }

  // 3. Actual Fail-Closed Check
  if (failClosedEvaluation) {
    const failClosedResult = verifyFailClosedBehavior(failClosedEvaluation);

    if (!failClosedResult.behavesCorrectly) {
      defects.push({
        category: "FAIL_CLOSED",
        description: failClosedResult.reason,
      });
    }
  }

  return {
    isCertified: defects.length === 0,
    defects,
  };
}

/**
 * Hard fail-closed guard.
 */
export function assertDeterminism<T>(
  fn: () => T,
  failClosedEvaluation?: () => FailClosedResponseLike,
  runs: number = 5
): void {
  const result = enforceDeterminism(fn, failClosedEvaluation, runs);

  if (!result.isCertified) {
    const errorDetails = result.defects
      .map((d) => `[${d.category}] ${d.description}`)
      .join("; ");

    throw new Error(`Determinism Certification Failed: ${errorDetails}`);
  }
}
