/**
 * P8-05: Filing Requirements Checker.
 *
 * Filing requirements are jurisdiction- and procedure-dependent legal rules.
 * The previous hardcoded universal document list is therefore removed.
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

export function checkFilingRequirements(
  filedDocuments: readonly FilingDocument[],
): FilingVerdict {
  void filedDocuments;

  return {
    isComplete: false,
    missingRequirements: [
      "NOT_DETERMINED — no validated filing-requirements rule graph is available; human legal review required.",
    ],
  };
}

export function hasMissingFilingRequirements(
  filedDocuments: readonly FilingDocument[],
): boolean {
  return !checkFilingRequirements(filedDocuments).isComplete;
}
