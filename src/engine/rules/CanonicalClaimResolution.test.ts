import { describe, expect, it } from "vitest";
import {
  resolveCanonicalClaim,
} from "./CanonicalClaimResolution";

describe("CanonicalClaimResolution", () => {
  it("resolves specific performance", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks specific performance of the Bainapatra.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("SPECIFIC_PERFORMANCE");
  });

  it("resolves SRA Section 8 possession recovery", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks recovery of possession under section 8 of the Specific Relief Act.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("POSSESSION_RECOVERY_SEC8");
  });

  it("resolves partition as PARTITION", () => {
    const result = resolveCanonicalClaim(
      "The co-sharers seek partition of the jointly owned property.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("PARTITION");
    expect(result.claimId).not.toBe("DECLARATION_SEC42");
  });

  it("does not resolve a bare possession narrative as Section 42 declaration", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff was dispossessed from the property.",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("resolves Section 42 declaration", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks a declaration under section 42 of the Specific Relief Act regarding title.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("DECLARATION_SEC42");
  });

  it("resolves inheritance", () => {
    const result = resolveCanonicalClaim(
      "The deceased ancestor left several heirs and the matter concerns succession.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("INHERITANCE_CONSULTATION");
  });

  it("fails closed for an unknown narrative", () => {
    const result = resolveCanonicalClaim(
      "There is a commercial disagreement between the parties.",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("fails closed when multiple canonical claims are simultaneously signalled", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks specific performance and partition of the property.",
    );

    expect(result.status).toBe("AMBIGUOUS");
    expect(result.claimId).toBeNull();
    expect(result.matchedSignals).toContain("SPECIFIC_PERFORMANCE");
    expect(result.matchedSignals).toContain("PARTITION");
  });

  it("does not classify a bare sale-deed narrative as specific performance", () => {
    const result = resolveCanonicalClaim(
      "The parties completed registration of the sale deed and possession was delivered.",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("does not let a declaration focus domain manufacture a Section 42 claim", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff disputes the amount payable under the transaction.",
      "declaration",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("does not let an SRA focus domain manufacture a Section 42 claim", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff disputes an unrelated contractual payment.",
      "Specific Relief Act",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("resolves an explicit partition claim without requiring co-sharer wording", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks partition of the property.",
    );

    expect(result.status).toBe("RESOLVED");
    expect(result.claimId).toBe("PARTITION");
  });

  it("does not classify generic dispossession as Section 8 possession recovery", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff was dispossessed from the land by the defendant.",
    );

    expect(result.status).toBe("UNRESOLVED");
    expect(result.claimId).toBeNull();
  });

  it("is deterministic", () => {
    const input =
      "The co-sharers seek partition of the jointly owned property.";

    expect(resolveCanonicalClaim(input)).toEqual(resolveCanonicalClaim(input));
  });

  it("does not mutate the returned resolution", () => {
    const result = resolveCanonicalClaim(
      "The plaintiff seeks specific performance of the Bainapatra.",
    );

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.matchedSignals)).toBe(true);
  });
});
