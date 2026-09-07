import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";

/**
 * P10-11: Output Integrity Verifier.
 * 
 * Verifies the structural integrity of the output schema registry.
 * Ensures arrays are populated, required fields exist, and the schema is sound.
 * Fails closed if the registry is corrupted or malformed.
 */

export function verifyOutputIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const registry = new DevelopmentOutputRegistry();
  const schema = registry.getSchema();

  if (!schema) {
    errors.push("Output schema is missing.");
    return { isValid: false, errors };
  }

  if (!schema.schemaId) errors.push("Missing schemaId in output schema.");
  if (!schema.version) errors.push("Missing version in output schema.");
  
  if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
    errors.push("Output schema sections array is missing or empty.");
    return { isValid: false, errors };
  }

  for (const section of schema.sections) {
    if (!section.sectionType) errors.push("Missing sectionType in memo section.");
    if (typeof section.required !== "boolean") errors.push(`Missing or invalid 'required' boolean in section ${section.sectionType}.`);
    if (!section.description) errors.push(`Missing description in section ${section.sectionType}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if the output schema is structurally invalid.
 */
export function assertOutputIntegrity(): void {
  const { isValid, errors } = verifyOutputIntegrity();
  if (!isValid) {
    throw new Error(`Output Integrity Check Failed: ${errors.join(", ")}`);
  }
}
