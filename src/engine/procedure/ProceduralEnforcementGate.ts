import { evaluateJurisdiction } from "./JurisdictionEvaluator";
import { calculateCourtFee } from "./CourtFeeCalculator";
import { checkMaintainability } from "./MaintainabilityChecker";
import { checkFilingRequirements } from "./FilingRequirementsChecker";
import { validateReliefForSuitType } from "./ReliefValidator";
import { verifyProceduralLimitationInteraction } from "./ProceduralLimitationInteraction";
import { generateProceduralAuditTrail } from "./ProceduralAuditTrail";
import type { ProceduralDefect } from "./ProceduralDefectDiscloser";
import type { CourtTier, SuitType } from "./ProcedureContracts";

/**
 * P8-10: Procedural Enforcement Gate.
 * 
 * Single source of truth for procedural validation. Combines jurisdiction,
 * court fees, maintainability, filing, relief, and limitation interaction.
 * Fails closed if any procedural defect is detected.
 */

export type ProceduralEvaluationInput = {
  suitType: SuitType;
  proposedCourtTier: CourtTier;
  suitValue?: number;
  facts: readonly { predicate: string; object?: string | null; verified?: boolean }[];
  prayedReliefs: readonly string[];
  appliedArticle: string;
};

export type ProceduralEvaluationResult = {
  isValid: boolean;
  defects: ProceduralDefect[];
  auditTrail: ReturnType<typeof generateProceduralAuditTrail>;
};

export function enforceProceduralRules(input: ProceduralEvaluationInput): ProceduralEvaluationResult {
  const defects: ProceduralDefect[] = [];

  // 1. Jurisdiction Check
  const jurisdiction = evaluateJurisdiction(input.suitType, input.proposedCourtTier, input.suitValue);
  if (!jurisdiction.isValid) {
    defects.push({ category: "JURISDICTION", description: jurisdiction.reason });
  }

  // 2. Court Fee Check
  const courtFee = calculateCourtFee(input.suitType, input.suitValue);
  if (!courtFee) {
    defects.push({ category: "COURT_FEE", description: "No court fee rule found for the suit type." });
  } else if (courtFee.feeAmount <= 0 && courtFee.feeType === "AD_VALOREM") {
    defects.push({ category: "COURT_FEE", description: courtFee.reason });
  }

  // 3. Maintainability Check
  const maintainability = checkMaintainability(input.suitType, input.facts);
  if (!maintainability.isMaintainable) {
    for (const defect of maintainability.defects) {
      defects.push({ category: "MAINTAINABILITY", description: defect });
    }
  }

  // 4. Filing Requirements Check
  const filing = checkFilingRequirements(input.facts);
  if (!filing.isComplete) {
    for (const missing of filing.missingRequirements) {
      defects.push({ category: "FILING", description: `Missing required filing document: ${missing}` });
    }
  }

  // 5. Relief Validation Check
  const relief = validateReliefForSuitType(input.suitType, input.prayedReliefs);
  if (!relief.isValid) {
    for (const invalid of relief.invalidReliefs) {
      defects.push({ category: "RELIEF", description: `Invalid relief prayed for suit type ${input.suitType}: ${invalid}` });
    }
  }

  // 6. Limitation Interaction Check
  const limitationInteraction = verifyProceduralLimitationInteraction(input.suitType, input.appliedArticle);
  if (!limitationInteraction.isValid) {
    defects.push({ category: "JURISDICTION", description: limitationInteraction.reason });
  }

  // Generate Audit Trail
  const auditTrail = generateProceduralAuditTrail(
    input.suitType,
    jurisdiction.isValid ? jurisdiction : null,
    courtFee,
    maintainability,
    defects
  );

  return {
    isValid: defects.length === 0,
    defects,
    auditTrail
  };
}
