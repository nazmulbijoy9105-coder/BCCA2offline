import * as DeterministicExecutionVerifier from "./DeterministicExecutionVerifier";
import * as RepeatabilityVerifier from "./RepeatabilityVerifier";
import * as FailClosedBehaviorVerifier from "./FailClosedBehaviorVerifier";

/**
 * P11-10: Determinism Integrity Verifier.
 * 
 * Verifies the structural integrity of the determinism module.
 * Ensures that all required fail-closed and determinism functions are 
 * loaded and haven't been accidentally deleted or tampered with.
 */

export function verifyDeterminismIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if required functions exist in the imported modules
  if (typeof DeterministicExecutionVerifier.verifyDeterministicExecution !== 'function') {
    errors.push("Missing verifyDeterministicExecution function.");
  }
  if (typeof RepeatabilityVerifier.verifyRepeatability !== 'function') {
    errors.push("Missing verifyRepeatability function.");
  }
  if (typeof FailClosedBehaviorVerifier.verifyFailClosedBehavior !== 'function') {
    errors.push("Missing verifyFailClosedBehavior function.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if the determinism module is structurally invalid.
 */
export function assertDeterminismIntegrity(): void {
  const { isValid, errors } = verifyDeterminismIntegrity();
  if (!isValid) {
    throw new Error(`Determinism Integrity Check Failed: ${errors.join(", ")}`);
  }
}
