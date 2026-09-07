import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";
import type { MemoSectionType } from "./OutputContracts";

const registry = new DevelopmentOutputRegistry();

/**
 * P10-02: Memo Schema Validator.
 * 
 * Verifies that a generated legal memo contains all the required sections 
 * defined in the authoritative registry. Prevents LLM hallucination of 
 * memo structures or omission of mandatory disclosures.
 */

export type SchemaValidationResult = {
  isValid: boolean;
  missingSections: MemoSectionType[];
};

export function validateMemoSchema(
  presentSections: readonly MemoSectionType[]
): SchemaValidationResult {
  const schema = registry.getSchema();
  const requiredSections = schema.sections.filter(s => s.required);
  const missingSections: MemoSectionType[] = [];

  for (const section of requiredSections) {
    if (!presentSections.includes(section.sectionType)) {
      missingSections.push(section.sectionType);
    }
  }

  return {
    isValid: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Hard fail-closed guard. Throws an error if required memo sections are missing.
 */
export function assertValidMemoSchema(
  presentSections: readonly MemoSectionType[]
): void {
  const result = validateMemoSchema(presentSections);
  if (!result.isValid) {
    throw new Error(`Memo Schema Validation Failed: Missing required sections: [${result.missingSections.join(", ")}]`);
  }
}
