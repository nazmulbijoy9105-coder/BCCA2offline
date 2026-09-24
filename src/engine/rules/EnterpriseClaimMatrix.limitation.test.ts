import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_CLAIM_REGISTRY,
  getClaimDefinition,
} from "./EnterpriseClaimMatrix";

describe("Enterprise Claim Matrix — limitation semantic integrity", () => {
  it("contains all canonical claims", () => {
    expect(
      ENTERPRISE_CLAIM_REGISTRY.map((definition) => definition.claimId),
    ).toEqual([
      "SPECIFIC_PERFORMANCE",
      "POSSESSION_RECOVERY_SEC8",
      "PARTITION",
      "DECLARATION_SEC42",
      "INHERITANCE_CONSULTATION",
    ]);
  });

  it("keeps specific performance on an executable limitation trigger", () => {
    const claim = getClaimDefinition("SPECIFIC_PERFORMANCE");

    expect(claim?.limitation).toMatchObject({
      status: "SPECIFIC_ARTICLE",
      primaryArticle: "ARTICLE_113",
      periodYears: 1,
    });

    expect(
      claim?.limitation.status === "SPECIFIC_ARTICLE"
        ? claim.limitation.accrualTrigger
        : null,
    ).toBe("PERFORMANCE_DATE_OR_REFUSAL");
  });

  it("does not model partition as a universal six-year Article 120 claim", () => {
    const claim = getClaimDefinition("PARTITION");

    expect(claim?.limitation).toMatchObject({
      status: "FACT_DEPENDENT",
      primaryArticle: null,
      accrualTrigger: null,
      periodYears: null,
    });
  });

  it("models Article 120 for declaration only as a residual candidate", () => {
    const claim = getClaimDefinition("DECLARATION_SEC42");

    expect(claim?.limitation).toMatchObject({
      status: "RESIDUAL_ARTICLE_CANDIDATE",
      primaryArticle: "ARTICLE_120",
      accrualTrigger: "RIGHT_TO_SUE_DATE",
      periodYears: 6,
    });
  });

  it("does not invent an ancestor-death limitation for inheritance consultation", () => {
    const claim = getClaimDefinition("INHERITANCE_CONSULTATION");

    expect(claim?.limitation).toMatchObject({
      status: "NOT_APPLICABLE",
      primaryArticle: null,
      accrualTrigger: null,
      periodYears: null,
    });

    expect(
      JSON.stringify(claim?.limitation),
    ).not.toContain("ANCESTOR_DEATH_DATE");
  });

  it("contains no unsupported matrix accrual trigger", () => {
    for (const claim of ENTERPRISE_CLAIM_REGISTRY) {
      if (claim.limitation.status === "SPECIFIC_ARTICLE") {
        expect([
          "FIXED_PERFORMANCE_DATE",
          "REFUSAL_DATE",
          "KNOWLEDGE_DATE",
          "DISPOSSESSION_DATE",
          "RIGHT_TO_SUE_DATE",
          "DEMAND_DATE",
          "CONTRACT_BREACH_DATE",
          "ADVERSE_POSSESSION_DATE",
          "PERFORMANCE_DATE_OR_REFUSAL",
        ]).toContain(claim.limitation.accrualTrigger);
      }

      if (
        claim.limitation.status === "FACT_DEPENDENT" ||
        claim.limitation.status === "NOT_APPLICABLE"
      ) {
        expect(claim.limitation.primaryArticle).toBeNull();
        expect(claim.limitation.accrualTrigger).toBeNull();
        expect(claim.limitation.periodYears).toBeNull();
      }
    }
  });
});
