/**
 * P9-01: Appeal / Review / Revision Integrity Contracts.
 * 
 * Establishes registry types for appellate procedure, including forums,
 * limitation metadata, and grounds. Registry authority is explicitly
 * represented and must not be inferred from fixture contents.
 */

export type AppellateAuthorityStatus =
  | "VALIDATED_PRODUCTION"
  | "DEVELOPMENT_FIXTURE";

export type AppellateRemedyType = 
  | "FIRST_APPEAL" 
  | "SECOND_APPEAL" 
  | "REVIEW" 
  | "REVISION" 
  | "LEAVE_TO_APPEAL";

export type AppellateForum = 
  | "SUPREME_COURT_APPELLATE_DIVISION" 
  | "SUPREME_COURT_HIGH_COURT_DIVISION" 
  | "DISTRICT_JUDGE"
  | "JOINT_DISTRICT_JUDGE";

export type AppellateRule = {
  ruleId: string;
  remedyType: AppellateRemedyType;
  statute: "CIVIL_PROCEDURE_CODE_1908" | "LIMITATION_ACT_1908";
  description: string;
  forum: {
    primaryForum: AppellateForum;
    prerequisiteForum?: AppellateForum;
  };
  limitation: {
    article: string; // Fixture article identifier
    periodDays: number;
  };
  grounds: readonly string[];
};

export type AppellateRegistry = {
  /**
   * Explicit authority classification.
   * Production legal outcomes require VALIDATED_PRODUCTION.
   */
  authorityStatus: AppellateAuthorityStatus;

  /**
   * Registry version identifies the exact registry definition.
   * It is not itself evidence of legal validity.
   */
  version: string;

  getRules(): readonly AppellateRule[];
  getCandidateRules(remedyType: string): readonly AppellateRule[];
};
