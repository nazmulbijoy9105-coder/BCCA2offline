import { describe, expect, it } from "vitest";
import {
  evaluateLimitation,
  type LimitationEvaluationInput,
} from "./LimitationEvaluator";
import {
  DevelopmentLimitationRegistry,
} from "./DevelopmentLimitationRegistry";
import type {
  LimitationFact,
  LimitationRule,
} from "./LimitationContracts";

const registry = new DevelopmentLimitationRegistry();

function rule(article: LimitationRule["article"]): LimitationRule {
  const found = registry
    .getRules()
    .find((candidate) => candidate.article === article);

  if (!found) {
    throw new Error(`Missing registry rule: ${article}`);
  }

  return found;
}

function fact(
  predicate: string,
  options: {
    object?: string;
    eventDate?: string;
    verified?: boolean;
  } = {},
): LimitationFact {
  return {
    predicate,
    object: options.object,
    eventDate: options.eventDate,
    verified: options.verified ?? true,
  };
}

function evaluate(
  article: LimitationRule["article"],
  facts: readonly LimitationFact[],
  referenceDate: string | null,
) {
  const input: LimitationEvaluationInput = {
    rule: rule(article),
    facts,
    referenceDate,
  };

  return evaluateLimitation(input);
}

describe("P5-15: deterministic limitation evaluator", () => {
  it("missing rule is INDETERMINATE", () => {
    const result = evaluateLimitation({
      rule: null,
      facts: [],
      referenceDate: "2026-01-01",
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isTimeBarred).toBeNull();
    expect(result.calculationType).toBe("missing_rule");
  });

  it("missing reference date is INDETERMINATE", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Performance Date", { eventDate: "2025-01-01" }),
        fact("Fixed Performance Date", { object: "YES" }),
      ],
      null,
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isTimeBarred).toBeNull();
    expect(result.calculationType).toBe("missing_reference_date");
  });

  it("Article 113 current law uses one year from fixed performance date", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Performance Date", { eventDate: "2024-01-15" }),
        fact("Fixed Performance Date", { object: "YES" }),
      ],
      "2025-01-15",
    );

    expect(result.status).toBe("NOT_BARRED");
    expect(result.isTimeBarred).toBe(false);
    expect(result.accrualDate).toBe("2024-01-15");
    expect(result.expiryDate).toBe("2025-01-15");
    expect(result.limitationPeriodYears).toBe(1);
    expect(result.limitationArticle).toBe("ARTICLE_113");
  });

  it("Article 113 is barred after the one-year anniversary", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Performance Date", { eventDate: "2024-01-15" }),
        fact("Fixed Performance Date", { object: "YES" }),
      ],
      "2025-01-16",
    );

    expect(result.status).toBe("BARRED");
    expect(result.isTimeBarred).toBe(true);
  });

  it("Article 113 historical accrual before 2005-07-01 uses three years", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Performance Date", { eventDate: "2004-06-30" }),
        fact("Fixed Performance Date", { object: "YES" }),
      ],
      "2007-06-30",
    );

    expect(result.status).toBe("NOT_BARRED");
    expect(result.expiryDate).toBe("2007-06-30");
    expect(result.limitationPeriodYears).toBe(3);
  });

  it("Article 113 historical accrual becomes barred after the three-year anniversary", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Performance Date", { eventDate: "2004-06-30" }),
        fact("Fixed Performance Date", { object: "YES" }),
      ],
      "2007-07-01",
    );

    expect(result.status).toBe("BARRED");
    expect(result.isTimeBarred).toBe(true);
    expect(result.limitationPeriodYears).toBe(3);
  });

  it("Article 113 can use refusal date when no fixed performance date exists", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Fixed Performance Date", { object: "NO" }),
        fact("Refusal Date", { eventDate: "2025-01-01" }),
      ],
      "2026-01-01",
    );

    expect(result.status).toBe("NOT_BARRED");
    expect(result.isTimeBarred).toBe(false);
    expect(result.accrualDate).toBe("2025-01-01");
    expect(result.limitationPeriodYears).toBe(1);
  });

  it("Article 113 missing alternative trigger is INDETERMINATE", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", { object: "SPECIFIC_PERFORMANCE" }),
        fact("Contract"),
        fact("Fixed Performance Date", { object: "NO" }),
      ],
      "2026-01-01",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isTimeBarred).toBeNull();
  });

  it("unverified applicability facts cannot establish a rule", () => {
    const result = evaluate(
      "ARTICLE_113",
      [
        fact("Relief", {
          object: "SPECIFIC_PERFORMANCE",
          verified: false,
        }),
        fact("Contract", { verified: false }),
        fact("Performance Date", {
          eventDate: "2024-01-01",
          verified: false,
        }),
        fact("Fixed Performance Date", {
          object: "YES",
          verified: false,
        }),
      ],
      "2026-01-01",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isTimeBarred).toBeNull();
  });

  it("Article 91 uses knowledge date and three years", () => {
    const result = evaluate(
      "ARTICLE_91",
      [
        fact("Relief", { object: "CANCELLATION_OR_SET_ASIDE" }),
        fact("Instrument"),
        fact("Cancellation Entitlement Facts"),
        fact("Knowledge Date", { eventDate: "2023-05-10" }),
      ],
      "2026-05-10",
    );

    expect(result.status).toBe("NOT_BARRED");
    expect(result.accrualDate).toBe("2023-05-10");
    expect(result.expiryDate).toBe("2026-05-10");
    expect(result.limitationPeriodYears).toBe(3);
  });

  it("Article 92 uses knowledge date and three years", () => {
    const result = evaluate(
      "ARTICLE_92",
      [
        fact("Relief", { object: "FORGERY_DECLARATION" }),
        fact("Instrument"),
        fact("Issue Or Registration Event", {
          eventDate: "2022-01-01",
        }),
        fact("Knowledge Date", { eventDate: "2023-01-01" }),
      ],
      "2026-01-02",
    );

    expect(result.status).toBe("BARRED");
    expect(result.accrualDate).toBe("2023-01-01");
    expect(result.expiryDate).toBe("2026-01-01");
    expect(result.limitationPeriodYears).toBe(3);
  });

  it("Article 142 requires recovery-of-possession applicability facts", () => {
    const result = evaluate(
      "ARTICLE_142",
      [
        fact("Relief", { object: "RECOVERY_OF_POSSESSION" }),
        fact("Plaintiff Possessory Entitlement"),
        fact("Dispossession Date", { eventDate: "2013-01-01" }),
      ],
      "2026-01-01",
    );

    expect(result.status).toBe("BARRED");
    expect(result.accrualDate).toBe("2013-01-01");
    expect(result.expiryDate).toBe("2025-01-01");
    expect(result.limitationPeriodYears).toBe(12);
  });

  it("calendar arithmetic handles leap-day accrual deterministically", () => {
    const result = evaluate(
      "ARTICLE_91",
      [
        fact("Relief", { object: "CANCELLATION_OR_SET_ASIDE" }),
        fact("Instrument"),
        fact("Cancellation Entitlement Facts"),
        fact("Knowledge Date", { eventDate: "2020-02-29" }),
      ],
      "2023-02-28",
    );

    expect(result.expiryDate).toBe("2023-02-28");
    expect(result.status).toBe("NOT_BARRED");
  });

  it("accrual after reference date is INDETERMINATE", () => {
    const result = evaluate(
      "ARTICLE_91",
      [
        fact("Relief", { object: "CANCELLATION_OR_SET_ASIDE" }),
        fact("Instrument"),
        fact("Cancellation Entitlement Facts"),
        fact("Knowledge Date", { eventDate: "2027-01-01" }),
      ],
      "2026-01-01",
    );

    expect(result.status).toBe("INDETERMINATE");
    expect(result.isTimeBarred).toBeNull();
    expect(result.calculationType).toBe("invalid_chronology");
  });
});
