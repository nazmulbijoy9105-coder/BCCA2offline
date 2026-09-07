/**
 * P11-04: Unknown Propagation.
 * 
 * Guarantees that an UNKNOWN fact state propagates through the engine 
 * without being blindly converted to FALSE or TRUE. The engine must 
 * explicitly carry the UNKNOWN state to the final verdict, resulting 
 * in INDETERMINATE.
 */

export type PropagationResult = {
  status: "BARRED" | "NOT_BARRED" | "INDETERMINATE";
  reason: string;
};

/**
 * Evaluates a list of fact states and ensures that if ANY fact is UNKNOWN,
 * the final status is INDETERMINATE.
 */
export function propagateUnknownStates(
  factStates: ("TRUE" | "FALSE" | "UNKNOWN")[]
): PropagationResult {
  if (factStates.includes("UNKNOWN")) {
    return {
      status: "INDETERMINATE",
      reason: "One or more required facts are in an UNKNOWN state. Verdict cannot be deterministically computed."
    };
  }

  // If all facts are TRUE or FALSE, the engine can proceed to a deterministic verdict.
  // (The specific verdict depends on the rule logic, but it is no longer blocked by UNKNOWN).
  return {
    status: "NOT_BARRED", // Or BARRED, depending on rule logic. Here we just signify no UNKNOWN block.
    reason: "All required facts are deterministically known (TRUE/FALSE)."
  };
}

/**
 * Hard fail-closed guard. Throws an error if UNKNOWN states are silently ignored.
 */
export function assertNoSilentUnknownPropagation(
  factStates: ("TRUE" | "FALSE" | "UNKNOWN")[]
): void {
  const result = propagateUnknownStates(factStates);
  if (factStates.includes("UNKNOWN") && result.status !== "INDETERMINATE") {
    throw new Error(`Unknown Propagation Violation: UNKNOWN state was silently ignored, resulting in status ${result.status}.`);
  }
}
