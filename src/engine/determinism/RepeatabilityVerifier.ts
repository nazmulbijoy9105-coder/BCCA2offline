import { canonicalStringify } from "../BCCAAEngine";

/**
 * P11-08: Repeatability Verifier.
 * 
 * Explicitly tests the repeatability of the engine. Runs the engine N times 
 * and asserts that the output object is deeply equal every single time, 
 * catching any non-deterministic mutations or race conditions.
 */

export type RepeatabilityResult = {
  isRepeatable: boolean;
  runs: number;
  reason: string;
};

/**
 * Executes a function N times and verifies that the JSON serialized output
 * is identical across all runs.
 */
export function verifyRepeatability<T>(
  fn: () => T,
  runs: number = 10
): RepeatabilityResult {
  if (runs < 2) {
    throw new Error("Repeatability verification requires at least 2 runs.");
  }

  const outputs: string[] = [];

  for (let i = 0; i < runs; i++) {
    const output = fn();
    // Use the repository-wide canonical serializer so nested object ordering
    // cannot create false nondeterminism.
    const serialized = canonicalStringify(output);
    outputs.push(serialized);
  }

  const firstOutput = outputs[0];
  const isRepeatable = outputs.every(o => o === firstOutput);

  return {
    isRepeatable,
    runs,
    reason: isRepeatable 
      ? `Engine produced identical output across ${runs} runs.`
      : `Engine produced non-repeatable output across ${runs} runs.`
  };
}

/**
 * Hard fail-closed guard. Throws an error if the engine is not repeatable.
 */
export function assertRepeatability<T>(
  fn: () => T,
  runs: number = 10
): void {
  const result = verifyRepeatability(fn, runs);
  if (!result.isRepeatable) {
    throw new Error(`Repeatability Violation: ${result.reason}`);
  }
}
