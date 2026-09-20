import { describe, expect, it } from "vitest";
import { compareCanonicalStrings } from "./crypto";

describe("P3-07: locale-independent canonical ordering", () => {
  it("uses locale-independent lexical ordering", () => {
    const values = [
      "rule-10",
      "rule-2",
      "RULE-1",
      "rule-A",
      "rule-a",
      "rule-Z",
      "rule-z",
      "é-rule",
      "e-rule",
    ];

    const expected = [...values].sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );

    const actual = [...values].sort(compareCanonicalStrings);

    expect(actual).toEqual(expected);
  });

  it("does not use locale collation semantics", () => {
    expect(compareCanonicalStrings("Z", "a")).toBeLessThan(0);
    expect(compareCanonicalStrings("a", "Z")).toBeGreaterThan(0);
    expect(compareCanonicalStrings("rule-10", "rule-2")).toBeLessThan(0);
    expect(compareCanonicalStrings("e-rule", "é-rule")).toBeLessThan(0);
  });

  it("returns zero only for identical strings", () => {
    expect(compareCanonicalStrings("same", "same")).toBe(0);
    expect(compareCanonicalStrings("a", "b")).not.toBe(0);
    expect(compareCanonicalStrings("b", "a")).not.toBe(0);
  });
});
