import type { SuitType } from "./ProcedureContracts";

/**
 * P8-06: Procedural Limitation Interaction.
 * 
 * Ensures that the limitation article applied by the engine correctly
 * matches the procedural suit type. Prevents mismatches like applying
 * Article 113 (Specific Performance) to a POSSESSION suit.
 */

// Map of valid Suit Types to their acceptable Limitation Articles
const VALID_SUIT_ARTICLE_MAP: Record<SuitType, string[]> = {
  "POSSESSION": ["ARTICLE_142", "ARTICLE_144", "ARTICLE_120"],
  "DECLARATION": ["ARTICLE_120", "ARTICLE_113"], // Declaration or residuary
  "DECLARATION_AND_POSSESSION": ["ARTICLE_142", "ARTICLE_144", "ARTICLE_120"],
  "PARTITION": ["ARTICLE_120"], // Partition suits usually fall to residuary
  "SPECIFIC_PERFORMANCE": ["ARTICLE_113"],
  "INJUNCTION": ["ARTICLE_120"], // Injunctions usually fall to residuary
  "RECOVERY_OF_MONEY": ["ARTICLE_120"] // Money claims usually fall to residuary
};

export type InteractionVerdict = {
  isValid: boolean;
  reason: string;
};

export function verifyProceduralLimitationInteraction(
  suitType: SuitType,
  appliedArticle: string
): InteractionVerdict {
  const validArticles = VALID_SUIT_ARTICLE_MAP[suitType];
  
  if (!validArticles) {
    return {
      isValid: false,
      reason: `Unknown suit type: ${suitType}. Cannot verify limitation interaction.`,
    };
  }

  if (!validArticles.includes(appliedArticle)) {
    return {
      isValid: false,
      reason: `Procedural Mismatch: Article ${appliedArticle} is not valid for suit type ${suitType}. Valid articles: [${validArticles.join(", ")}].`,
    };
  }

  return {
    isValid: true,
    reason: `Article ${appliedArticle} is valid for suit type ${suitType}.`,
  };
}
