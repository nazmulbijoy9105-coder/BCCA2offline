import { describe, expect, it } from "vitest";
import {
  assertDeterministicExecution,
  verifyDeterministicExecution,
} from "./DeterministicExecutionVerifier";
import {
  assertRepeatability,
  verifyRepeatability,
} from "./RepeatabilityVerifier";
import { generateDeterminismAuditTrail } from "./DeterminismAuditTrail";
import { verifyFailClosedBehavior } from "./FailClosedBehaviorVerifier";
import { enforceDeterminism } from "./DeterminismEnforcementGate";

describe("P11 Determinism Integrity", () => {
  it("verifies an actual fail-closed response rather than simulating a fallback", () => {
    const result = verifyFailClosedBehavior(() => ({
      executionStatus: "ERROR",
      outcome: "ERROR",
      stage13: {
        legalConclusions: [],
      },
    }));

    expect(result.behavesCorrectly).toBe(true);
  });

  it("rejects a normal response from fail-closed certification", () => {
    const result = verifyFailClosedBehavior(() => ({
      executionStatus: "COMPLETED",
      outcome: "STRUCTURAL_ONLY",
      stage13: {
        legalConclusions: [],
      },
    }));

    expect(result.behavesCorrectly).toBe(false);
  });

  it("rejects fail-closed certification when an error response contains legal conclusions", () => {
    const result = verifyFailClosedBehavior(() => ({
      executionStatus: "ERROR",
      outcome: "ERROR",
      stage13: {
        legalConclusions: [{ conclusion: "UNSAFE_TEST_CONCLUSION" }],
      },
    }));

    expect(result.behavesCorrectly).toBe(false);
    expect(result.reason).toContain("substantive legal conclusions");
  });

  it("enforcement gate can combine deterministic output with an actual fail-closed response", () => {
    const result = enforceDeterminism(
      () => ({
        status: "ERROR",
        outcome: "ERROR",
        stage13: {
          legalConclusions: [],
        },
      }),
      () => ({
        executionStatus: "ERROR",
        outcome: "ERROR",
        stage13: {
          legalConclusions: [],
        },
      }),
      3,
    );

    expect(result.isCertified).toBe(true);
    expect(result.defects).toEqual([]);
  });

  it("produces a stable canonical hash across repeated executions", () => {
    const result = verifyDeterministicExecution(
      () => ({
        z: 3,
        nested: {
          beta: 2,
          alpha: 1,
        },
        a: 1,
      }),
      5
    );

    expect(result.isDeterministic).toBe(true);
    expect(result.runs).toBe(5);
    expect(result.finalHash).toBeTruthy();
    expect(new Set(result.hashes).size).toBe(1);
  });

  it("detects genuinely different outputs", () => {
    let counter = 0;

    const result = verifyDeterministicExecution(
      () => ({
        value: counter++,
      }),
      3
    );

    expect(result.isDeterministic).toBe(false);
    expect(result.finalHash).toBeNull();
    expect(new Set(result.hashes).size).toBeGreaterThan(1);
  });

  it("treats nested object key reordering as deterministic", () => {
    let flip = false;

    const result = verifyRepeatability(
      () => {
        flip = !flip;

        return flip
          ? {
              outer: {
                alpha: 1,
                beta: 2,
              },
              value: 10,
            }
          : {
              value: 10,
              outer: {
                beta: 2,
                alpha: 1,
              },
            };
      },
      4
    );

    expect(result.isRepeatable).toBe(true);
  });

  it("asserts deterministic execution without throwing for stable output", () => {
    expect(() =>
      assertDeterministicExecution(
        () => ({
          answer: "STABLE",
          facts: ["A", "B"],
        }),
        4
      )
    ).not.toThrow();
  });

  it("asserts repeatability without throwing for stable output", () => {
    expect(() =>
      assertRepeatability(
        () => ({
          status: "OK",
          nested: {
            x: 1,
            y: 2,
          },
        }),
        4
      )
    ).not.toThrow();
  });

  it("fails closed when deterministic verification receives fewer than two runs", () => {
    expect(() =>
      verifyDeterministicExecution(() => "x", 1)
    ).toThrow("Deterministic verification requires at least 2 runs.");
  });

  it("fails closed when repeatability verification receives fewer than two runs", () => {
    expect(() =>
      verifyRepeatability(() => "x", 1)
    ).toThrow("Repeatability verification requires at least 2 runs.");
  });

  it("generates a deterministic audit trail from a supplied timestamp", () => {
    const timestamp = "2026-09-09T00:00:00.000Z";

    const first = generateDeterminismAuditTrail(
      timestamp,
      "EXECUTION_HASH",
      true,
      "Stable canonical hash."
    );

    const second = generateDeterminismAuditTrail(
      timestamp,
      "EXECUTION_HASH",
      true,
      "Stable canonical hash."
    );

    expect(first).toEqual(second);
    expect(first.timestamp).toBe(timestamp);
    expect(first.testType).toBe("EXECUTION_HASH");
    expect(first.behavesCorrectly).toBe(true);
  });
});
