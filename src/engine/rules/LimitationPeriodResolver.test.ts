import { describe, expect, it } from "vitest";
import { DevelopmentLimitationRegistry } from "./DevelopmentLimitationRegistry";
import { resolveLimitationPeriod } from "./LimitationPeriodResolver";

describe("P4-06 — Limitation Period Resolver", () => {
  const registry = new DevelopmentLimitationRegistry();

  it("resolves current Article 113 to one year", () => {
    const rule = registry
      .getRules()
      .find((candidate) => candidate.article === "ARTICLE_113")!;

    const result = resolveLimitationPeriod(rule, "2024-01-15");

    expect(result.status).toBe("RESOLVED");
    expect(result.periodValue).toBe(1);
    expect(result.periodUnit).toBe("YEAR");
    expect(result.temporalVersion).not.toBeNull();
  });

  it("resolves historical Article 113 to three years", () => {
    const rule = registry
      .getRules()
      .find((candidate) => candidate.article === "ARTICLE_113")!;

    const result = resolveLimitationPeriod(rule, "2004-01-01");

    expect(result.status).toBe("RESOLVED");
    expect(result.periodValue).toBe(3);
    expect(result.periodUnit).toBe("YEAR");
    expect(result.temporalVersion).not.toBeNull();
  });

  it("fails closed for invalid accrual dates", () => {
    const rule = registry.getRules()[0];

    const result = resolveLimitationPeriod(
      rule,
      "2024-02-30",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.temporalVersion).toBeNull();
    expect(result.periodValue).toBeNull();
    expect(result.periodUnit).toBeNull();
  });

  it("fails closed when no temporal version applies", () => {
    const rule = registry
      .getRules()
      .find((candidate) => candidate.article === "ARTICLE_113")!;

    const result = resolveLimitationPeriod(
      rule,
      "1908-01-01",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.temporalVersion).toBeNull();
    expect(result.periodValue).toBeNull();
    expect(result.periodUnit).toBeNull();
  });

  it("fails closed when temporal versions overlap", () => {
    const rule = {
      ...registry
        .getRules()
        .find((candidate) => candidate.article === "ARTICLE_113")!,
      temporalVersions: [
        {
          effectiveFrom: "1909-01-01",
          effectiveTo: "2005-07-01",
          limitationPeriodYears: 3,
        },
        {
          effectiveFrom: "2000-01-01",
          effectiveTo: "2010-01-01",
          limitationPeriodYears: 1,
        },
      ],
    };

    const result = resolveLimitationPeriod(
      rule,
      "2004-01-01",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.temporalVersion).toBeNull();
    expect(result.periodValue).toBeNull();
    expect(result.periodUnit).toBeNull();
  });
});
