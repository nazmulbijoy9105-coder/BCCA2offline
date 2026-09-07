import { verifyDeterministicExecution } from "./DeterministicExecutionVerifier";
import { verifyRepeatability } from "./RepeatabilityVerifier";
import { verifyFailClosedBehavior } from "./FailClosedBehaviorVerifier";

/**
 * P11-09: Determinism Enforcement Gate.
 * 
 * Single source of truth for determinism certification. Combines execution 
 * hash, repeatability, and fail-closed behavior checks.
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
  expectedFailClosedFallback?: "BARRED" | "NOT_BARRED" | "INDETERMINATE",
  runs: number = 5
): DeterminismEvaluationResult {
  const defects: DeterminismDefect[] = [];

  // 1. Execution Hash Check
  const execResult = verifyDeterministicExecution(fn, runs);
  if (!execResult.isDeterministic) {
    defects.push({ 
      category: "EXECUTION_HASH", 
      description: `Output hash varied across ${runs} runs.` 
    });
  }

  // 2. Repeatability Check
  const repeatResult = verifyRepeatability(fn, runs);
  if (!repeatResult.isRepeatable) {
    defects.push({ 
      category: "REPEATABILITY", 
      description: `Deep equality failed across ${runs} runs.` 
    });
  }

  // 3. Fail-Closed Check (only if fallback status is provided for testing)
  if (expectedFailClosedFallback) {
    const failClosedResult = verifyFailClosedBehavior(fn, expectedFailClosedFallback);
    if (!failClosedResult.behavesCorrectly) {
      defects.push({ 
        category: "FAIL_CLOSED", 
        description: failClosedResult.reason 
      });
    }
  }

  return {
    isCertified: defects.length === 0,
    defects,
  };
}

/**
 * Hard fail-closed guard. Throws an error if determinism checks fail.
 */
export function assertDeterminism<T>(
  fn: () => T,
  expectedFailClosedFallback?: "BARRED" | "NOT_BARRED" | "INDETERMINATE",
  runs: number = 5
): void {
  const result = enforceDeterminism(fn, expectedFailClosedFallback, runs);
  if (!result.isCertified) {
    const errorDetails = result.defects.map(d => `[${d.category}] ${d.description}`).join("; ");
    throw new Error(`Determinism Certification Failed: ${errorDetails}`);
  }
}
