import type { OutputDefect } from "./OutputEnforcementGate";

/**
 * P10-09: Output Audit Trail.
 * 
 * Generates a verifiable audit trail for the legal memo validation.
 * Bundles the validation status and any defects into a single payload 
 * with a timestamp.
 */

export type OutputAuditRecord = {
  timestamp: string;
  isValid: boolean;
  defects: readonly OutputDefect[];
};

export function generateOutputAuditTrail(
  isValid: boolean,
  defects: readonly OutputDefect[]
): OutputAuditRecord {
  return {
    timestamp: new Date().toISOString(),
    isValid,
    defects,
  };
}
