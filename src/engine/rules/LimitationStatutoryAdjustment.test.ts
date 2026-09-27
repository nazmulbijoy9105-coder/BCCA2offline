import { Tristate } from "./RuleContracts";
import { describe, expect, it } from "vitest";
import {
  resolveLimitationStatutoryAdjustment,
} from "./LimitationStatutoryAdjustment";

describe("P4-07 — Limitation Statutory Adjustment", () => {
  it("resolves the P4-06 calendar boundary as the final deadline when no Section 4 closure is established", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.FALSE,
          verified: true,
        },
      ],
    });

    expect(result).toEqual({
      status: "RESOLVED",
      finalDeadline: "2025-01-15",
      appliedAdjustments: [
        "SECTION_12_FIRST_DAY_EXCLUDED",
      ],
      pendingAdjustments: [],
      errors: [],
    });
  });

  it("applies Section 4 when verified court closure and reopening facts are present", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-15",
        },
        {
          predicate: "Court Reopening Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-16",
        },
      ],
    });

    expect(result).toEqual({
      status: "RESOLVED",
      finalDeadline: "2025-01-16",
      appliedAdjustments: [
        "SECTION_12_FIRST_DAY_EXCLUDED",
        "SECTION_4_COURT_CLOSURE",
      ],
      pendingAdjustments: [],
      errors: [],
    });
  });

  it("fails closed when Section 4 closure is established without a reopening date", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-15",
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
    expect(result.pendingAdjustments).toEqual([
      "SECTION_4_COURT_CLOSURE",
    ]);
  });

  it("fails closed when the closure date does not match the raw expiry", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-14",
        },
        {
          predicate: "Court Reopening Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-16",
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
  });

  it("fails closed when Section 4 closure status is unresolved", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [],
    });

    expect(result).toEqual({
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments: [
        "SECTION_12_FIRST_DAY_EXCLUDED",
      ],
      pendingAdjustments: [
        "SECTION_4_COURT_CLOSURE",
      ],
      errors: [
        "Court closure status on the limitation expiry date is unresolved",
      ],
    });
  });

  it("does not infer Section 4 from an unverified closure fact", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: false,
          eventDate: "2025-01-15",
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
    expect(result.pendingAdjustments).toEqual([
      "SECTION_4_COURT_CLOSURE",
    ]);
  });

  it("fails closed for duplicate verified closure facts", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-15",
        },
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-15",
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
  });

  it("fails closed for an invalid raw expiry date", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "not-a-date",
      facts: [],
    });

    expect(result).toEqual({
      status: "INDETERMINATE",
      finalDeadline: null,
      appliedAdjustments: [],
      pendingAdjustments: [],
      errors: ["Invalid raw limitation expiry date"],
    });
  });
});

describe("P4-07 — Section 4 three-valued closure semantics", () => {
  it("resolves explicit verified FALSE as an open court date", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.FALSE,
          verified: true,
        },
      ],
    });

    expect(result.status).toBe("RESOLVED");
    expect(result.finalDeadline).toBe("2025-01-15");
    expect(result.appliedAdjustments).toEqual([
      "SECTION_12_FIRST_DAY_EXCLUDED",
    ]);
  });

  it("fails closed when verified TRUE and FALSE closure facts conflict", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.TRUE,
          verified: true,
          eventDate: "2025-01-15",
        },
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.FALSE,
          verified: true,
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
  });

  it("fails closed for multiple verified FALSE closure facts", () => {
    const result = resolveLimitationStatutoryAdjustment({
      rawExpiryDate: "2025-01-15",
      facts: [
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.FALSE,
          verified: true,
        },
        {
          predicate: "Court Closed On Limitation Date",
          state: Tristate.FALSE,
          verified: true,
        },
      ],
    });

    expect(result.status).toBe("INDETERMINATE");
    expect(result.finalDeadline).toBeNull();
  });
});
