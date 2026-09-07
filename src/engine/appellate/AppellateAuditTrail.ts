import type { AppellateRemedyType } from "./AppellateContracts";
import type { AppellateDefect } from "./AppellateEnforcementGate";

/**
 * P9-06: Appellate Audit Trail.
 * 
 * Generates a verifiable audit trail for appellate evaluations.
 * Bundles remedy type, defects, and limitation expiry into a 
 * single payload with a timestamp.
 */

export type AppellateAuditRecord = {
  timestamp: string;
  remedyType: AppellateRemedyType;
  limitationExpiryDate: string | null;
  defects: readonly AppellateDefect[];
};

export function generateAppellateAuditTrail(
  remedyType: AppellateRemedyType,
  limitationExpiryDate: string | null,
  defects: readonly AppellateDefect[]
): AppellateAuditRecord {
  return {
    timestamp: new Date().toISOString(),
    remedyType,
    limitationExpiryDate,
    defects,
  };
}
