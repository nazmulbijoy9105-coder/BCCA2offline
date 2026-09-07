/**
 * P11-07: Hash Stability Verifier.
 * 
 * Verifies the hash stability of the engine's output over time.
 * If the engine's output hash for a specific standard test case changes,
 * it means either the logic or the underlying corpus has drifted.
 */

export type HashStabilityResult = {
  isStable: boolean;
  expectedHash: string;
  actualHash: string;
};

/**
 * Compares an actual runtime hash against a pinned expected hash.
 */
export function verifyHashStability(
  expectedHash: string,
  actualHash: string
): HashStabilityResult {
  return {
    isStable: expectedHash === actualHash,
    expectedHash,
    actualHash
  };
}

/**
 * Hard fail-closed guard. Throws an error if the hashes do not match.
 */
export function assertHashStability(
  expectedHash: string,
  actualHash: string
): void {
  const result = verifyHashStability(expectedHash, actualHash);
  if (!result.isStable) {
    throw new Error(`Hash Stability Violation: Expected output hash ${expectedHash}, but calculated ${actualHash}. Engine logic or corpus may have drifted.`);
  }
}
