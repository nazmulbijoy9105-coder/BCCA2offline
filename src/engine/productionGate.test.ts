import { describe, expect, it } from "vitest";
import {
  assertLegalEngineProductionReady,
} from "./productionGate";

describe("P0-1: production legal-engine boundary", () => {
  it("allows development fixture outside production", () => {
    expect(() =>
      assertLegalEngineProductionReady(false, {
        corpusMode: "DEVELOPMENT",
        authorityStatus: "DEVELOPMENT_FIXTURE",
      }),
    ).not.toThrow();
  });

  it("fails closed for development corpus in production", () => {
    expect(() =>
      assertLegalEngineProductionReady(true, {
        corpusMode: "DEVELOPMENT",
        authorityStatus: "DEVELOPMENT_FIXTURE",
      }),
    ).toThrow(
      /production legal analysis requires VALIDATED_PRODUCTION/,
    );
  });

  it("fails closed when corpus is validated but authority is not", () => {
    expect(() =>
      assertLegalEngineProductionReady(true, {
        corpusMode: "VALIDATED_PRODUCTION",
        authorityStatus: "DEVELOPMENT_FIXTURE",
      }),
    ).toThrow();
  });

  it("allows production only when both validation boundaries are satisfied", () => {
    expect(() =>
      assertLegalEngineProductionReady(true, {
        corpusMode: "VALIDATED_PRODUCTION",
        authorityStatus: "VALIDATED_PRODUCTION",
      }),
    ).not.toThrow();
  });
});
