import { describe, expect, it } from "vitest";
import { evaluateLimitationDeadline } from "./LimitationDeadline";

describe("P4-06 — Limitation Deadline", () => {
  it("is not barred on the final deadline", () => {
    expect(
      evaluateLimitationDeadline("2025-01-15", "2025-01-15"),
    ).toEqual({
      isTimeBarred: false,
      status: "NOT_BARRED",
    });
  });

  it("is barred after the final deadline", () => {
    expect(
      evaluateLimitationDeadline("2025-01-16", "2025-01-15"),
    ).toEqual({
      isTimeBarred: true,
      status: "BARRED",
    });
  });

  it("is indeterminate for missing dates", () => {
    expect(
      evaluateLimitationDeadline(null, "2025-01-15"),
    ).toEqual({
      isTimeBarred: null,
      status: "INDETERMINATE",
    });
  });
});
