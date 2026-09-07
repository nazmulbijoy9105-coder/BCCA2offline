/**
 * P8-05: Filing Requirements Checker.
 * 
 * Verifies that all mandatory filing requirements under the CPC have been met.
 * E.g., Affidavit, Court Fee Stamp, List of Documents, Vakalatnama.
 * Fails closed if any required filing predicate is missing.
 */

export type FilingDocument = {
  predicate: string;
  object?: string | null;
  verified?: boolean;
};

export type FilingVerdict = {
  isComplete: boolean;
  missingRequirements: string[];
};

const REQUIRED_FILING_PREDICATES = [
  "Affidavit",
  "Court Fee Stamp",
  "List of Documents",
  "Vakalatnama"
];

export function checkFilingRequirements(
  filedDocuments: readonly FilingDocument[]
): FilingVerdict {
  const missing: string[] = [];

  for (const req of REQUIRED_FILING_PREDICATES) {
    const isPresent = filedDocuments.some(doc => 
      doc.predicate === req && doc.verified !== false
    );
    
    if (!isPresent) {
      missing.push(req);
    }
  }

  return {
    isComplete: missing.length === 0,
    missingRequirements: missing,
  };
}

/**
 * Hard fail-closed guard. Returns true if any filing requirements are missing.
 */
export function hasMissingFilingRequirements(
  filedDocuments: readonly FilingDocument[]
): boolean {
  return !checkFilingRequirements(filedDocuments).isComplete;
}
