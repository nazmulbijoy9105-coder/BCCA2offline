import { describe, expect, it } from "vitest";
import {
  buildMissingEvidenceAlertModel,
} from "./MissingEvidenceAlert";
import type { CaseAnalysisResponse } from "../types/types";

type EvidenceStage = CaseAnalysisResponse["stage7"];

function stage7(
  overrides: Partial<EvidenceStage> = {},
): EvidenceStage {
  return {
    issues: [],
    oralAssertions: 0,
    documentaryEvidence: 0,
    missingEvidence: [],
    ...overrides,
  };
}

describe("MissingEvidenceAlert model", () => {
  it("consumes engine-produced missing evidence", () => {
    const result = buildMissingEvidenceAlertModel(
      stage7({
        missingEvidence: [
          {
            predicate: "Agreement Registration",
            object: "registered",
          },
        ],
        evidenceIntegrity: {
          status: "INDETERMINATE",
          isBlocking: true,
          linkageFailures: [],
          provenanceFailures: [],
          rejectedFacts: [],
          unsupportedAssertions: [],
          duplicateFacts: false,
          missingEvidence: [
            {
              predicate: "Agreement Registration",
              object: "registered",
            },
          ],
          custodyStatus: "NOT_APPLICABLE",
          unregisteredDocumentIds: [],
          lifecycleStatus: "NOT_APPLICABLE",
          extractionHashStatus: "NOT_AVAILABLE",
          narrativeFactCount: 1,
          documentaryFactCount: 0,
          warnings: [],
          reasons: ["Required evidence has not been verified."],
        },
      }),
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isBlocking).toBe(true);
    expect(result.missingEvidence).toEqual([
      {
        title: "Agreement Registration",
        detail: "Object: registered",
      },
    ]);
    expect(result.reasons).toEqual([
      "Required evidence has not been verified.",
    ]);
  });

  it("preserves engine integrity failures without creating legal conclusions", () => {
    const result = buildMissingEvidenceAlertModel(
      stage7({
        evidenceIntegrity: {
          status: "FAIL",
          isBlocking: true,
          linkageFailures: ["FACT-001"],
          provenanceFailures: ["FACT-002"],
          rejectedFacts: ["FACT-003"],
          unsupportedAssertions: ["ASSERTION-001"],
          duplicateFacts: false,
          missingEvidence: [],
          custodyStatus: "FAIL",
          unregisteredDocumentIds: ["DOC-001"],
          lifecycleStatus: "AVAILABLE",
          extractionHashStatus: "MISMATCH",
          narrativeFactCount: 3,
          documentaryFactCount: 1,
          warnings: ["Evidence chain requires review."],
          reasons: ["Evidence integrity failure."],
        },
      }),
    );

    expect(result.status).toBe("FAIL");
    expect(result.isBlocking).toBe(true);
    expect(result.linkageFailures).toEqual(["FACT-001"]);
    expect(result.provenanceFailures).toEqual(["FACT-002"]);
    expect(result.rejectedFacts).toEqual(["FACT-003"]);
    expect(result.unsupportedAssertions).toEqual(["ASSERTION-001"]);
    expect(result.unregisteredDocumentIds).toEqual(["DOC-001"]);
    expect(result.custodyStatus).toBe("FAIL");
    expect(result.extractionHashStatus).toBe("MISMATCH");
  });

  it("does not treat missing evidence as FALSE or manufacture a statutory result", () => {
    const result = buildMissingEvidenceAlertModel(
      stage7({
        missingEvidence: [
          {
            predicate: "Required Document",
          },
        ],
        evidenceIntegrity: {
          status: "INDETERMINATE",
          isBlocking: true,
          linkageFailures: [],
          provenanceFailures: [],
          rejectedFacts: [],
          unsupportedAssertions: [],
          duplicateFacts: false,
          missingEvidence: [
            {
              predicate: "Required Document",
            },
          ],
          custodyStatus: "NOT_APPLICABLE",
          unregisteredDocumentIds: [],
          lifecycleStatus: "NOT_APPLICABLE",
          extractionHashStatus: "NOT_AVAILABLE",
          narrativeFactCount: 0,
          documentaryFactCount: 0,
          warnings: [],
          reasons: [],
        },
      }),
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isBlocking).toBe(true);
    expect(result.missingEvidence).toHaveLength(1);

    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain("court will");
    expect(serialized).not.toContain("statutory bar");
    expect(serialized).not.toContain("unmaintainable");
    expect(serialized).not.toContain("will be rejected");
  });

  it("remains controlled when evidence integrity is unavailable", () => {
    const result = buildMissingEvidenceAlertModel(
      stage7({
        missingEvidence: [],
      }),
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isBlocking).toBe(false);
    expect(result.warnings).toContain(
      "Evidence integrity status is not available in the engine output.",
    );
  });
});
