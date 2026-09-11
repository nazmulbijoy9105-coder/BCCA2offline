import {
  calculateClaimDefinitionHash,
  calculateClaimRegistryHash,
  assertClaimDefinitionProvenance,
  assertClaimDefinitionHash,
  type ClaimDefinitionProvenance,
} from "./ClaimMatrixProvenance";
/**
 * Enterprise Claim Matrix
 * 
 * Defines the comprehensive schema for all civil litigation claim types.
 * This replaces hardcoded switch statements with a deterministic, data-driven registry.
 */

export type ClaimCategory = 
  | "PROPERTY" 
  | "CONTRACT" 
  | "FAMILY" 
  | "EQUITABLE" 
  | "TORT";

export interface ClaimElement {
  elementId: string;
  description: string;
  requiredPredicates: Array<{
    subject: string;
    predicate: string;
    object?: string;
    requiredTruth: "TRUE" | "FALSE";
  }>;
}

export interface EnterpriseClaimDefinition {
  claimId: string;
  claimName: string;
  category: ClaimCategory;
  statutoryBasis: {
    act: string;
    sections: string[];
  };
  limitation: {
    primaryArticle: string;
    accrualTrigger: string;
    periodYears: number;
  };
  maintainabilityRules: string[];
  elements: ClaimElement[];
  courtFeeType: "AD_VALOREM" | "FIXED" | "MULTIPLE";
  forum: string;
  provenance: ClaimDefinitionProvenance;
  definitionHash: string;
}

/**
 * The Master Claim Registry
 */
const CLAIM_MATRIX_DEFINITIONS: readonly Omit<EnterpriseClaimDefinition, "definitionHash">[] = [
  // 1. SPECIFIC PERFORMANCE (Contract)
  {
    claimId: "SPECIFIC_PERFORMANCE",
    claimName: "Specific Performance of Contract",
    category: "CONTRACT",
    statutoryBasis: { act: "Specific Relief Act 1877", sections: ["Sec 12"] },
    limitation: { primaryArticle: "ARTICLE_113", accrualTrigger: "PERFORMANCE_DATE_OR_REFUSAL", periodYears: 1 },
    maintainabilityRules: [
      "Contract must be valid and enforceable",
      "Plaintiff must be ready and willing to perform",
      "Balance consideration must be deposited in Court"
    ],
    elements: [
      { 
        elementId: "ELEMENT_VALID_CONTRACT", 
        description: "Execution of valid Bainapatra/Agreement", 
        requiredPredicates: [{ subject: "Bainapatra", predicate: "Execution Date", requiredTruth: "TRUE" }] 
      },
      { 
        elementId: "ELEMENT_REGISTRATION", 
        description: "Registration status of the deed", 
        requiredPredicates: [{ subject: "Bainapatra", predicate: "Registration Status", object: "REGISTERED", requiredTruth: "TRUE" }] 
      }
    ],
    courtFeeType: "AD_VALOREM",
    forum: "Senior Assistant Judge / Joint District Judge",
    provenance: {
      authorities: [
        {
          authorityId: "BD-SRA-1877-SEC12",
          act: "Specific Relief Act 1877",
          section: "Sec 12",
          sourceId: "SRA_1877_SEC_12",
          validationStatus: "SOURCE_VERIFIED"
        }
      ],
      validation: {
        scoped: true,
        authoritative: false,
        legallyValidated: false,
        independentlyValidated: false,
        productionApproved: false
      }
    },
  },

  // 2. RECOVERY OF POSSESSION (Property - Sec 8 SRA)
  {
    claimId: "POSSESSION_RECOVERY_SEC8",
    claimName: "Recovery of Possession (Section 8 SRA)",
    category: "PROPERTY",
    statutoryBasis: { act: "Specific Relief Act 1877", sections: ["Sec 8"] },
    limitation: { primaryArticle: "ARTICLE_142", accrualTrigger: "DISPOSSESSION_DATE", periodYears: 12 },
    maintainabilityRules: [
      "Plaintiff must prove prior possession",
      "Plaintiff must prove dispossession by defendant",
      "Suit must be filed within 12 years of dispossession"
    ],
    elements: [
      { 
        elementId: "ELEMENT_PRIOR_POSSESSION", 
        description: "Plaintiff was in prior peaceful possession", 
        requiredPredicates: [{ subject: "Plaintiff", predicate: "Possession Status", object: "IN_POSSESSION", requiredTruth: "TRUE" }] 
      },
      { 
        elementId: "ELEMENT_DISPOSSESSION", 
        description: "Defendant dispossessed the plaintiff", 
        requiredPredicates: [{ subject: "Plaintiff", predicate: "Possession Status", object: "DISPOSSESSED", requiredTruth: "TRUE" }] 
      }
    ],
    courtFeeType: "AD_VALOREM",
    forum: "Senior Assistant Judge",
    provenance: {
      authorities: [
        {
          authorityId: "BD-SRA-1877-SEC8",
          act: "Specific Relief Act 1877",
          section: "Sec 8",
          sourceId: "SRA_1877_SEC_8",
          validationStatus: "SOURCE_VERIFIED"
        }
      ],
      validation: {
        scoped: true,
        authoritative: false,
        legallyValidated: false,
        independentlyValidated: false,
        productionApproved: false
      }
    },
  },

  // 3. PARTITION (Property & Family)
  {
    claimId: "PARTITION",
    claimName: "Partition of Joint Property",
    category: "PROPERTY",
    statutoryBasis: { act: "Specific Relief Act 1877", sections: ["Sec 9"] },
    limitation: { primaryArticle: "ARTICLE_120", accrualTrigger: "RIGHT_TO_SUE_DATE", periodYears: 6 },
    maintainabilityRules: [
      "Property must be jointly owned/co-parcenary",
      "Plaintiff must pray for partition by metes and bounds"
    ],
    elements: [
      { 
        elementId: "ELEMENT_JOINT_OWNERSHIP", 
        description: "Property is jointly owned", 
        requiredPredicates: [{ subject: "Property", predicate: "Ownership Structure", object: "JOINT", requiredTruth: "TRUE" }] 
      }
    ],
    courtFeeType: "FIXED",
    forum: "Joint District Judge",
    provenance: {
      authorities: [
        {
          authorityId: "BD-SRA-1877-SEC9",
          act: "Specific Relief Act 1877",
          section: "Sec 9",
          sourceId: "SRA_1877_SEC_9",
          validationStatus: "SOURCE_VERIFIED"
        }
      ],
      validation: {
        scoped: true,
        authoritative: false,
        legallyValidated: false,
        independentlyValidated: false,
        productionApproved: false
      }
    },
  },

  // 4. DECLARATION (Property - Sec 42 SRA)
  {
    claimId: "DECLARATION_SEC42",
    claimName: "Declaration of Legal Character/Title",
    category: "PROPERTY",
    statutoryBasis: { act: "Specific Relief Act 1877", sections: ["Sec 42"] },
    limitation: { primaryArticle: "ARTICLE_120", accrualTrigger: "RIGHT_TO_SUE_DATE", periodYears: 6 },
    maintainabilityRules: [
      "Proviso: If out of possession, MUST pray for consequential relief (possession)",
      "Declaration cannot be for a collateral purpose"
    ],
    elements: [
      { 
        elementId: "ELEMENT_TITLE", 
        description: "Plaintiff holds valid title", 
        requiredPredicates: [{ subject: "Plaintiff", predicate: "Title Status", object: "REGISTERED_OWNER", requiredTruth: "TRUE" }] 
      }
    ],
    courtFeeType: "FIXED",
    forum: "Joint District Judge",
    provenance: {
      authorities: [
        {
          authorityId: "BD-SRA-1877-SEC42",
          act: "Specific Relief Act 1877",
          section: "Sec 42",
          sourceId: "SRA_1877_SEC_42",
          validationStatus: "SOURCE_VERIFIED"
        }
      ],
      validation: {
        scoped: true,
        authoritative: false,
        legallyValidated: false,
        independentlyValidated: false,
        productionApproved: false
      }
    },
  },

  // 5. INHERITANCE_CONSULTATION (Family)
  {
    claimId: "INHERITANCE_CONSULTATION",
    claimName: "Inheritance Share Calculation",
    category: "FAMILY",
    statutoryBasis: { act: "Muslim Personal Law (Shariat) Application Act 1937", sections: ["Succession"] },
    limitation: { primaryArticle: "ARTICLE_120", accrualTrigger: "ANCESTOR_DEATH_DATE", periodYears: 6 },
    maintainabilityRules: [
      "Ancestor must be proven deceased",
      "Heirship must be established (Warisan Sanad)",
      "Unilateral disowning affidavit is legally void"
    ],
    elements: [
      { 
        elementId: "ELEMENT_DEATH", 
        description: "Ancestor is deceased", 
        requiredPredicates: [{ subject: "Ancestor", predicate: "Vital Status", object: "DECEASED", requiredTruth: "TRUE" }] 
      }
    ],
    courtFeeType: "FIXED",
    forum: "Joint District Judge",
    provenance: {
      authorities: [
        {
          authorityId: "BD-MPLSA-1937-SUCCESSION",
          act: "Muslim Personal Law (Shariat) Application Act 1937",
          section: "Succession",
          sourceId: "MPLSA_1937_SUCCESSION",
          validationStatus: "SOURCE_VERIFIED"
        }
      ],
      validation: {
        scoped: true,
        authoritative: false,
        legallyValidated: false,
        independentlyValidated: false,
        productionApproved: false
      }
    },
  }
];

/**
 * P1-NEXT-03:
 * Claim definitions are provenance-bound and deterministically hashed.
 *
 * The matrix remains non-production until the underlying authorities and
 * legal interpretations receive the required human/independent validation.
 *
 * Hashes are calculated during immutable registry construction. The exported
 * registry is never mutated after initialization.
 */
export const ENTERPRISE_CLAIM_REGISTRY: readonly EnterpriseClaimDefinition[] =
  CLAIM_MATRIX_DEFINITIONS.map(definition => {
    assertClaimDefinitionProvenance({
      ...definition,
      definitionHash: "",
    });

    const definitionHash = calculateClaimDefinitionHash(definition);

    const provenancedDefinition: EnterpriseClaimDefinition = {
      ...definition,
      definitionHash,
    };

    assertClaimDefinitionHash(provenancedDefinition);

    return provenancedDefinition;
  });

export const ENTERPRISE_CLAIM_REGISTRY_HASH = calculateClaimRegistryHash(
  ENTERPRISE_CLAIM_REGISTRY,
);

/**
 * Utility function to retrieve a claim definition by ID
 */
export function getClaimDefinition(claimId: string): EnterpriseClaimDefinition | null {
  return ENTERPRISE_CLAIM_REGISTRY.find(c => c.claimId === claimId) ?? null;
}
