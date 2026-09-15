import { describe, expect, it } from "vitest";
import { CitationValidator } from "../CitationValidator";

describe("N4-03: Citation Provenance Binding", () => {
  it("binds a verified citation to an explicit authority identity", () => {
    const result = CitationValidator.validate("60 DLR (AD) 54");

    expect(result.verificationStatus).toBe("VERIFIED_CANONICAL");
    expect(result.authorityBinding).toBeDefined();
    expect(result.authorityBinding?.authorityId).toBe(
      "AUTH-PRECEDENT-CIT-60DLR54-AD",
    );
  });

  it("marks citation authority as development until production validation exists", () => {
    const result = CitationValidator.validate("60 DLR (AD) 54");

    expect(result.authorityBinding?.authorityStatus).toBe(
      "DEVELOPMENT_FIXTURE",
    );
  });

  it("binds provenance to the canonical precedent identity and citation", () => {
    const result = CitationValidator.validate("60 DLR (AD) 54");

    expect(result.authorityBinding?.provenance).toEqual({
      sourceId: "CIT-60DLR54-AD",
      citation: "60 DLR (AD) 54",
    });
  });

  it("does not add runtime timestamps to citation provenance", () => {
    const result = CitationValidator.validate("60 DLR (AD) 54");
    const binding = result.authorityBinding;

    expect(binding).toBeDefined();

    expect(
      Object.prototype.hasOwnProperty.call(binding, "timestamp"),
    ).toBe(false);

    expect(
      Object.prototype.hasOwnProperty.call(
        binding?.provenance ?? {},
        "timestamp",
      ),
    ).toBe(false);

    expect(
      Object.prototype.hasOwnProperty.call(
        binding?.provenance ?? {},
        "auditTimestamp",
      ),
    ).toBe(false);
  });

  it("fails closed without creating an authority binding for an unknown citation", () => {
    const result = CitationValidator.validate("999 DLR (AD) 9999");

    expect(result.verificationStatus).toBe("FAILED_UNVERIFIED");
    expect(result.authorityBinding).toBeUndefined();
  });

  it("produces deterministic authority binding across repeated validation", () => {
    const first = CitationValidator.validate("60 DLR (AD) 54");
    const second = CitationValidator.validate("60 DLR (AD) 54");

    expect(first.authorityBinding).toEqual(second.authorityBinding);
  });

  it("does not treat provenance binding as legal correctness validation", () => {
    const result = CitationValidator.validate("60 DLR (AD) 54");

    expect(result.authorityBinding?.authorityStatus).toBe(
      "DEVELOPMENT_FIXTURE",
    );
    expect(result.verificationStatus).toBe("VERIFIED_CANONICAL");
  });
});
