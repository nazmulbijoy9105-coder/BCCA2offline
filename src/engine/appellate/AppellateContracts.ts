/**
 * P9-01: Appeal / Review / Revision Integrity Contracts.
 * 
 * Establishes the authoritative registry types for appellate procedure,
 * including forums, limitation periods, and grounds for appeal, review, and revision.
 */

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
    article: string; // E.g., "ARTICLE_152" or "ARTICLE_156"
    periodDays: number;
  };
  grounds: readonly string[];
};

export type AppellateRegistry = {
  getRules(): readonly AppellateRule[];
  getCandidateRules(remedyType: string): readonly AppellateRule[];
};
