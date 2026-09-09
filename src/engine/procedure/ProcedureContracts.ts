/**
 * P8-01: Procedure & Remedy Integrity Contracts.
 * 
 * Establishes the authoritative registry types for civil procedure,
 * including jurisdiction, court fees, maintainability, and filing requirements.
 */

export type SuitType = 
  | "POSSESSION" 
  | "DECLARATION" 
  | "DECLARATION_AND_POSSESSION" 
  | "PARTITION" 
  | "SPECIFIC_PERFORMANCE" 
  | "INJUNCTION" 
  | "RECOVERY_OF_MONEY";

export type CourtTier = 
  | "SUPREME_COURT_APPELLATE_DIVISION" 
  | "SUPREME_COURT_HIGH_COURT_DIVISION" 
  | "DISTRICT_JUDGE" 
  | "JOINT_DISTRICT_JUDGE" 
  | "SENIOR_ASSISTANT_JUDGE" 
  | "ASSISTANT_JUDGE" 
  | "SMALL_CAUSES_COURT";

export type ProcedureRule = {
  ruleId: string;
  suitType: SuitType;
  statute: "CIVIL_PROCEDURE_CODE_1908" | "COURT_FEES_ACT_1870" | "SPECIFIC_RELIEF_ACT_1877";
  description: string;
  jurisdiction: {
    primaryCourtTier: CourtTier;
    pecuniaryLimit?: {
      min: number;
      max: number;
    };
  };
  courtFee: {
    type: "AD_VALOREM" | "FIXED" | "MULTIPLE";
    actRef: string;
  };
  maintainabilityPrerequisites: readonly string[];
};

export type ProcedureAuthorityStatus =
  | "DEVELOPMENT_FIXTURE"
  | "VALIDATED_PRODUCTION";

export type ProcedureRegistry = {
  readonly authorityStatus: ProcedureAuthorityStatus;
  readonly registryVersion: string;
  getRules(): readonly ProcedureRule[];
  getCandidateRules(suitType: string): readonly ProcedureRule[];
};
