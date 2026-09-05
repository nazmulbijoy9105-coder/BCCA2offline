import { LIMITATION_ACT_1908_CORPUS } from "./LimitationAct1908Corpus";

/**
 * P6-10: Legal Corpus Verification.
 * 
 * Verifies the structural integrity of the hardcoded legal corpus.
 * Ensures arrays are populated, required fields exist, and the schema is sound.
 * Fails closed if the corpus is corrupted or malformed.
 */

export function verifyCorpusIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const corpus = LIMITATION_ACT_1908_CORPUS;

  if (!corpus || typeof corpus !== "object") {
    errors.push("Corpus root is missing or not an object.");
    return { isValid: false, errors };
  }

  if (!corpus.metadata || !corpus.metadata.act_no) {
    errors.push("Missing or invalid metadata.act_no.");
  }

  if (!Array.isArray(corpus.definitions) || !corpus.definitions.length) {
    errors.push("Definitions array is missing or empty.");
  }

  if (!corpus.schedule) {
    errors.push("Schedule object is missing.");
  } else {
    if (!Array.isArray(corpus.schedule.division_1_suits) || !corpus.schedule.division_1_suits.length) {
      errors.push("Schedule division_1_suits is missing or empty.");
    }
    if (!Array.isArray(corpus.schedule.division_2_appeals) || !corpus.schedule.division_2_appeals.length) {
      errors.push("Schedule division_2_appeals is missing or empty.");
    }
    if (!Array.isArray(corpus.schedule.division_3_applications) || !corpus.schedule.division_3_applications.length) {
      errors.push("Schedule division_3_applications is missing or empty.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if the corpus is structurally invalid.
 */
export function assertCorpusIntegrity(): void {
  const { isValid, errors } = verifyCorpusIntegrity();
  if (!isValid) {
    throw new Error(`Corpus Integrity Check Failed: ${errors.join(", ")}`);
  }
}
