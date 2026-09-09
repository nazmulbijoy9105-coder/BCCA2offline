import type { JurisdictionVerdict } from "./JurisdictionEvaluator";
import type { CourtFeeVerdict } from "./CourtFeeCalculator";
import type { MaintainabilityVerdict } from "./MaintainabilityChecker";
import type { ProceduralDefect } from "./ProceduralDefectDiscloser";
import type { SuitType } from "./ProcedureContracts";

/**
 * P8-09: Procedural Audit Trail.
 * 
 * Generates a verifiable audit trail for procedural evaluations.
 * Bundles jurisdiction, court fee, maintainability, and defects into a 
 * single payload with a timestamp.
 */

export type ProceduralAuditRecord = {
  timestamp: string;
  suitType: SuitType;
  jurisdiction: JurisdictionVerdict | null;
  courtFee: CourtFeeVerdict | null;
  maintainability: MaintainabilityVerdict | null;
  defects: readonly ProceduralDefect[];
};

export function generateProceduralAuditTrail(
  suitType: SuitType,
  jurisdiction: JurisdictionVerdict | null,
  courtFee: CourtFeeVerdict | null,
  maintainability: MaintainabilityVerdict | null,
  defects: readonly ProceduralDefect[],
  timestamp: string,
): ProceduralAuditRecord {
  return {
    timestamp,
    suitType,
    jurisdiction,
    courtFee,
    maintainability,
    defects,
  };
}
