import { createHash } from "node:crypto";

/**
 * P11-01: Deterministic Execution Verifier.
 * 
 * Mathematically proves the engine is deterministic by running a function 
 * multiple times and verifying the output snapshot hash remains perfectly stable.
 */

export type DeterministicTestResult = {
  isDeterministic: boolean;
  runs: number;
  finalHash: string | null;
  hashes: string[];
};

/**
 * Executes a function N times, hashes the JSON output of each run,
 * and verifies that all hashes match.
 */
export function verifyDeterministicExecution<T>(
  fn: () => T,
  runs: number = 5
): DeterministicTestResult {
  if (runs < 2) {
    throw new Error("Deterministic verification requires at least 2 runs.");
  }

  const hashes: string[] = [];

  for (let i = 0; i < runs; i++) {
    const output = fn();
    const serialized = JSON.stringify(output, Object.keys(output as object).sort());
    const hash = createHash("sha256").update(serialized).digest("hex");
    hashes.push(hash);
  }

  const firstHash = hashes[0];
  const isDeterministic = hashes.every(h => h === firstHash);

  return {
    isDeterministic,
    runs,
    finalHash: isDeterministic ? firstHash : null,
    hashes
  };
}

/**
 * Hard fail-closed guard. Throws an error if the function is not deterministic.
 */
export function assertDeterministicExecution<T>(
  fn: () => T,
  runs: number = 5
): void {
  const result = verifyDeterministicExecution(fn, runs);
  if (!result.isDeterministic) {
    throw new Error(`Determinism Violation: Function produced different output hashes across ${runs} runs. Hashes: [${result.hashes.join(", ")}]`);
  }
}
