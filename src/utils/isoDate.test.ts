import { describe, it, expect } from "vitest";
import {
  isISODateString, addDaysISO, addMonthsISO, addYearsISO, compareISO,
} from "./isoDate";

describe("isoDate — UTC-safe legal date arithmetic (P4-04 / P3-07)", () => {
  it("accepts valid ISO dates", () => {
    expect(isISODateString("2024-02-29")).toBe(true);
    expect(isISODateString("1909-01-01")).toBe(true);
    expect(isISODateString("2005-07-01")).toBe(true);
  });

  it("rejects malformed/impossible dates — fail-closed", () => {
    expect(isISODateString("2024-02-30")).toBe(false);
    expect(isISODateString("2024-13-01")).toBe(false);
    expect(isISODateString("2023-02-29")).toBe(false);
    expect(isISODateString("2024/01/01")).toBe(false);
    expect(isISODateString("2024-1-1")).toBe(false);
    expect(isISODateString("")).toBe(false);
  });

  it("P3-07 boundary: leap day + 1 day crosses cleanly in UTC", () => {
    expect(addDaysISO("2024-02-29", 1)).toBe("2024-03-01");
  });

  it("adds across month/year boundaries", () => {
    expect(addDaysISO("2024-01-31", 30)).toBe("2024-03-01");
    expect(addDaysISO("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDaysISO("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("returns null on invalid addDays input", () => {
    expect(addDaysISO("2024-02-30", 1)).toBeNull();
    expect(addDaysISO("not-a-date", 1)).toBeNull();
    expect(addDaysISO("2024-01-31", 1.5)).toBeNull();
  });

  it("addMonthsISO clamps month-end (leap and non-leap)", () => {
    expect(addMonthsISO("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonthsISO("2023-01-31", 1)).toBe("2023-02-28");
    expect(addMonthsISO("2024-03-31", 1)).toBe("2024-04-30");
    expect(addMonthsISO("2024-11-15", 3)).toBe("2025-02-15");
  });

  it("addYearsISO clamps Feb-29 anniversary; limitation anniversary exact", () => {
    expect(addYearsISO("2024-02-29", 1)).toBe("2025-02-28");
    expect(addYearsISO("2024-02-29", 4)).toBe("2028-02-29");
    expect(addYearsISO("2020-08-20", 3)).toBe("2023-08-20");
  });

  it("compareISO orders chronologically", () => {
    expect(compareISO("2024-02-29", "2024-03-01")).toBe(-1);
    expect(compareISO("2024-03-01", "2024-02-29")).toBe(1);
    expect(compareISO("2024-03-01", "2024-03-01")).toBe(0);
  });

  it("deterministic: repeated identical calls produce identical output", () => {
    expect(addDaysISO("2024-02-29", 30)).toBe(addDaysISO("2024-02-29", 30));
  });
});
