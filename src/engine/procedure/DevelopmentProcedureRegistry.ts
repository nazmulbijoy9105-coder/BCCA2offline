import type {
  ProcedureRegistry,
  ProcedureRule,
} from "./ProcedureContracts";

/**
 * Development Procedure Registry.
 *
 * P8-01:
 * DEVELOPMENT FIXTURE ONLY.
 *
 * This registry is NOT an authoritative or validated production legal
 * corpus. Structural validity, version identity, or hashing must never
 * be treated as statutory validation.
 */
const PROCEDURE_RULES: readonly ProcedureRule[] = [
  {
    ruleId: "BD-PROC-SUIT-POSSESSION-SEC8",
    suitType: "POSSESSION",
    statute: "SPECIFIC_RELIEF_ACT_1877",
    description: "Suit by dispossessed proprietor to recover possession (Section 8 SRA).",
    jurisdiction: {
      primaryCourtTier: "SENIOR_ASSISTANT_JUDGE",
    },
    courtFee: {
      type: "AD_VALOREM",
      actRef: "Court Fees Act 1870, Schedule II, Article 1(iii)",
    },
    maintainabilityPrerequisites: [
      "Plaintiff must prove prior possession",
      "Plaintiff must prove dispossession by defendant",
      "Suit must be filed within limitation period",
    ],
  },
  {
    ruleId: "BD-PROC-SUIT-DECLARATION-SEC42",
    suitType: "DECLARATION",
    statute: "SPECIFIC_RELIEF_ACT_1877",
    description: "Suit for declaration of legal character or title (Section 42 SRA).",
    jurisdiction: {
      primaryCourtTier: "JOINT_DISTRICT_JUDGE",
    },
    courtFee: {
      type: "FIXED",
      actRef: "Court Fees Act 1870, Schedule II, Article 17(iii)",
    },
    maintainabilityPrerequisites: [
      "If out of possession, must pray for consequential relief (Section 42 Proviso)",
      "Declaration must not be for a collateral purpose",
    ],
  },
];

export class DevelopmentProcedureRegistry implements ProcedureRegistry {
  readonly authorityStatus = "DEVELOPMENT_FIXTURE" as const;
  readonly registryVersion = "1.0";

  getRules(): readonly ProcedureRule[] {
    return PROCEDURE_RULES;
  }

  getCandidateRules(suitType: string): readonly ProcedureRule[] {
    return PROCEDURE_RULES.filter((rule) =>
      rule.suitType === suitType,
    );
  }
}
