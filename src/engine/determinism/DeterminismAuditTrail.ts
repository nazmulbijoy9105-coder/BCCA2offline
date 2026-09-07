/**
 * P11-06: Determinism Audit Trail.
 * 
 * Generates a verifiable audit trail for determinism checks.
 * Bundles the test type, result, and reason into a single payload with a timestamp.
 */

export type DeterminismTestType = 
  | "EXECUTION_HASH" 
  | "MALFORMED_INPUT" 
  | "MISSING_FACT" 
  | "UNKNOWN_PROPAGATION" 
  | "FAIL_CLOSED";

export type DeterminismAuditRecord = {
  timestamp: string;
  testType: DeterminismTestType;
  behavesCorrectly: boolean;
  reason: string;
};

export function generateDeterminismAuditTrail(
  testType: DeterminismTestType,
  behavesCorrectly: boolean,
  reason: string
): DeterminismAuditRecord {
  return {
    timestamp: new Date().toISOString(),
    testType,
    behavesCorrectly,
    reason,
  };
}
