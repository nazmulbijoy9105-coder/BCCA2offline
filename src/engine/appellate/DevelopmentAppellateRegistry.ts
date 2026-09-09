import type {
  AppellateRegistry,
  AppellateRule,
} from "./AppellateContracts";

/**
 * Development Appellate Registry.
 * P9-01: Development fixture containing example appellate metadata.
 * This registry is NOT authoritative production legal authority.
 */
const APPELLATE_RULES: readonly AppellateRule[] = [
  {
    ruleId: "BD-APPEAL-FIRST-APPEAL-DJ",
    remedyType: "FIRST_APPEAL",
    statute: "CIVIL_PROCEDURE_CODE_1908",
    description: "First appeal to the District Judge from decrees of Joint District Judges.",
    forum: {
      primaryForum: "DISTRICT_JUDGE",
      prerequisiteForum: "JOINT_DISTRICT_JUDGE",
    },
    limitation: {
      article: "ARTICLE_152",
      periodDays: 30,
    },
    grounds: [
      "Error of law",
      "Error of fact",
      "Improper admission/rejection of evidence",
    ],
  },
  {
    ruleId: "BD-APPEAL-SECOND-APPEAL-HCD",
    remedyType: "SECOND_APPEAL",
    statute: "CIVIL_PROCEDURE_CODE_1908",
    description: "Second appeal to the High Court Division from first appellate decrees.",
    forum: {
      primaryForum: "SUPREME_COURT_HIGH_COURT_DIVISION",
      prerequisiteForum: "DISTRICT_JUDGE",
    },
    limitation: {
      article: "ARTICLE_156",
      periodDays: 90,
    },
    grounds: [
      "Substantial question of law only (Section 100 CPC)",
    ],
  },
  {
    ruleId: "BD-APPEAL-REVIEW-HCD",
    remedyType: "REVIEW",
    statute: "CIVIL_PROCEDURE_CODE_1908",
    description: "Application for review of judgment by the High Court Division.",
    forum: {
      primaryForum: "SUPREME_COURT_HIGH_COURT_DIVISION",
    },
    limitation: {
      article: "ARTICLE_173",
      periodDays: 90,
    },
    grounds: [
      "Discovery of new and important matter (Order XLVII Rule 1)",
      "Mistake or error apparent on the face of the record",
      "Any other sufficient reason",
    ],
  },
];

export class DevelopmentAppellateRegistry implements AppellateRegistry {
  /**
   * This registry is intentionally non-authoritative.
   * Its legal-looking entries are development fixtures only.
   */
  readonly authorityStatus = "DEVELOPMENT_FIXTURE" as const;
  readonly version = "1.0-fixture";

  getRules(): readonly AppellateRule[] {
    return APPELLATE_RULES;
  }

  getCandidateRules(remedyType: string): readonly AppellateRule[] {
    return APPELLATE_RULES.filter((rule) =>
      rule.remedyType === remedyType,
    );
  }
}
