import { describe, expect, it } from "vitest";
import { computeLimitationDeadline } from "./LimitationStatutoryComputation";

describe("P4-06 — Limitation Statutory Computation boundary", () => {
  it("computes a calendar-year raw expiry", () => {
    const result = computeLimitationDeadline({
      accrualDate: "2024-01-15",
      periodValue: 1,
      periodUnit: "YEAR",
    });

    expect(result).not.toBeNull();
    expect(result?.rawExpiryDate).toBe("2025-01-15");
    expect(result?.finalDeadline).toBeNull();
    expect(result?.status).toBe("BASE_CALENDAR_ONLY");
  });

  it("preserves leap-day calendar behavior", () => {
    const result = computeLimitationDeadline({
      accrualDate: "2024-02-29",
      periodValue: 1,
      periodUnit: "YEAR",
    });

    expect(result?.rawExpiryDate).toBe("2025-02-28");
  });

  it("supports month periods", () => {
    const result = computeLimitationDeadline({
      accrualDate: "2024-01-31",
      periodValue: 1,
      periodUnit: "MONTH",
    });

    expect(result?.rawExpiryDate).toBe("2024-02-29");
  });

  it("supports day periods", () => {
    const result = computeLimitationDeadline({
      accrualDate: "2024-02-29",
      periodValue: 1,
      periodUnit: "DAY",
    });

    expect(result?.rawExpiryDate).toBe("2024-03-01");
  });

  it("explicitly records statutory adjustments as pending", () => {
    const result = computeLimitationDeadline({
      accrualDate: "2024-01-15",
      periodValue: 1,
      periodUnit: "YEAR",
    });

    expect(result?.pendingAdjustments).toEqual([
      "SECTION_4_COURT_CLOSURE",
      "SECTION_5_APPLICABILITY_BOUNDARY",
      "SECTION_12_EXCLUSIONS",
      "SECTIONS_13_25_ADJUSTMENTS",
      "SECTION_29_SPECIAL_LAW_INTERACTION",
    ]);
  });
});
