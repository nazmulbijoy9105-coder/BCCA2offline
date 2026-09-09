import { describe, expect, it } from "vitest";
import {
  evaluateEvidenceIntegrity,
  type EvidenceIntegrityGateInput,
} from "./EvidenceIntegrityGate";
import { getEvidenceHash } from "./EvidenceIntegrityHasher";

function makeFact(
  overrides: Partial<EvidenceIntegrityGateInput["facts"][number]> = {},
): EvidenceIntegrityGateInput["facts"][number] {
  return {
    factId: "F-1",
    propositionId: "P-1",
    predicate: "Registration Status",
    object: "registered",
    truth: "TRUE",
    validationStatus: "VERIFIED",
    assertionType: "PARTY_NARRATIVE",
    source: {
      documentId: "INPUT_NARRATIVE",
      sourceType: "INPUT_NARRATIVE",
      extractionMethod: "PATTERN",
    },
    ...overrides,
  };
}

describe("P7 Evidence Integrity Gate", () => {
  it("returns NOT_AVAILABLE when no trusted extraction hash is supplied", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [makeFact()],
    });

    expect(result.extractionHashStatus).toBe("NOT_AVAILABLE");
    expect(result.status).toBe("INDETERMINATE");
  });

  it("verifies a trusted extraction hash when the evidence is unchanged", () => {
    const fact = makeFact();

    const expectedHash = getEvidenceHash([
      {
        factId: fact.factId,
        predicate: fact.predicate,
        object: fact.object ?? null,
        truth: fact.truth,
        eventDate: null,
      },
    ]);

    const result = evaluateEvidenceIntegrity({
      facts: [fact],
      expectedExtractionHash: expectedHash,
    });

    expect(result.extractionHashStatus).toBe("VERIFIED");
    expect(result.status).toBe("PASS");
  });

  it("fails closed when the trusted extraction hash does not match", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [makeFact()],
      expectedExtractionHash: "0000000000000000000000000000000000000000000000000000000000000000",
    });

    expect(result.extractionHashStatus).toBe("MISMATCH");
    expect(result.status).toBe("FAIL");
    expect(result.isBlocking).toBe(true);
    expect(result.reasons.some((r) => /hash mismatch/i.test(r))).toBe(true);
  });

  it("fails when required provenance is incomplete", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [
        makeFact({
          source: {
            documentId: "INPUT_NARRATIVE",
          },
        }),
      ],
    });

    expect(result.status).toBe("FAIL");
    expect(result.isBlocking).toBe(true);
    expect(result.provenanceFailures.length).toBeGreaterThan(0);
  });

  it("does not treat a narrative mention of a document as an external custody record", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [
        makeFact({
          assertionType: "DOCUMENTARY_FACT",
          source: {
            documentId: "INPUT_NARRATIVE",
            sourceType: "INPUT_NARRATIVE",
            extractionMethod: "PATTERN",
          },
        }),
      ],
    });

    expect(result.documentaryFactCount).toBe(1);
    expect(result.custodyStatus).toBe("NOT_APPLICABLE");
    expect(result.status).not.toBe("FAIL");
  });

  it("fails when an external documentary fact has no custody registry", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [
        makeFact({
          assertionType: "DOCUMENTARY_FACT",
          source: {
            documentId: "DOC-001",
            sourceType: "DOCUMENT",
            extractionMethod: "DOCUMENT_VALIDATION",
          },
        }),
      ],
    });

    expect(result.custodyStatus).toBe("FAIL");
    expect(result.status).toBe("FAIL");
    expect(result.isBlocking).toBe(true);
  });

  it("returns INDETERMINATE when required evidence is missing or unverified", () => {
    const result = evaluateEvidenceIntegrity({
      facts: [makeFact()],
      requiredEvidence: [
        {
          predicate: "Payment Status",
          object: "paid",
        },
      ],
    });

    expect(result.missingEvidence).toHaveLength(1);
    expect(result.status).toBe("INDETERMINATE");
    expect(result.isBlocking).toBe(true);
  });
});
