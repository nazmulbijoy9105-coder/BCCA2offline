import type { OutputDefect } from "./OutputEnforcementGate";

/**
 * P10-09: Deterministic Output Audit Trail.
 *
 * The timestamp is supplied by the engine's deterministic execution envelope.
 * This function MUST NOT read wall-clock time.
 */

export type OutputAuditRecord = {
  timestamp: string;
  isValid: boolean;
  defects: readonly OutputDefect[];
};

export function generateOutputAuditTrail(
  timestamp: string,
  isValid: boolean,
  defects: readonly OutputDefect[],
): OutputAuditRecord {
  return {
    timestamp,
    isValid,
    defects,
  };
}
