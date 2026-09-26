import { describe, expect, it } from "vitest";
import { DevelopmentLimitationRegistry } from "./DevelopmentLimitationRegistry";
import { resolveLimitationAccrual } from "./LimitationAccrualResolver";

describe("P4-06 — Limitation Accrual Resolver", () => {
  const registry = new DevelopmentLimitationRegistry();

  function rule(article: string) {
    return registry
      .getRules()
      .find((candidate) => candidate.article === article)!;
  }

  it("resolves Article 113 fixed performance date", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_113"), [
      {
        predicate: "Fixed Performance Date",
        object: "YES",
        verified: true,
      },
      {
        predicate: "Performance Date",
        eventDate: "2024-01-15",
        verified: true,
      },
    ]);

    expect(result).toEqual({
      accrualDate: "2024-01-15",
      error: null,
    });
  });

  it("resolves Article 113 refusal date when no fixed date exists", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_113"), [
      {
        predicate: "Fixed Performance Date",
        object: "NO",
        verified: true,
      },
      {
        predicate: "Refusal Date",
        eventDate: "2025-01-01",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBe("2025-01-01");
  });

  it("resolves Article 115 by explicit breach mode", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_115"), [
      {
        predicate: "Contract Breach Mode",
        object: "SUCCESSIVE",
        verified: true,
      },
      {
        predicate: "Successive Breach Date",
        eventDate: "2024-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBe("2024-01-15");
  });

  it("rejects Article 115 without an explicit breach mode", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_115"), [
      {
        predicate: "Contract Breach Date",
        eventDate: "2024-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBeNull();
  });

  it("requires the analogous commencement for Article 116", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_116"), [
      {
        predicate: "Analogous Unregistered Contract Start",
        eventDate: "2021-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBe("2021-01-15");
  });

  it("requires the analogous private-suit commencement for Article 149", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_149"), [
      {
        predicate: "Analogous Private Suit Start",
        eventDate: "1970-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBe("1970-01-15");
  });

  it("rejects multiple verified dates instead of selecting one", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_114"), [
      {
        predicate: "Knowledge Date",
        eventDate: "2025-01-01",
        verified: true,
      },
      {
        predicate: "Knowledge Date",
        eventDate: "2025-02-01",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBeNull();
  });

  it("rejects multiple verified Article 113 fixed-date states", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_113"), [
      {
        predicate: "Fixed Performance Date",
        object: "YES",
        verified: true,
      },
      {
        predicate: "Fixed Performance Date",
        object: "NO",
        verified: true,
      },
      {
        predicate: "Performance Date",
        eventDate: "2024-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBeNull();
    expect(result.error).toContain("multiple verified facts");
  });

  it("rejects multiple verified Article 115 breach modes", () => {
    const result = resolveLimitationAccrual(rule("ARTICLE_115"), [
      {
        predicate: "Contract Breach Mode",
        object: "ORDINARY",
        verified: true,
      },
      {
        predicate: "Contract Breach Mode",
        object: "CONTINUING",
        verified: true,
      },
      {
        predicate: "Contract Breach Date",
        eventDate: "2024-01-15",
        verified: true,
      },
    ]);

    expect(result.accrualDate).toBeNull();
    expect(result.error).toContain("multiple verified facts");
  });


});
