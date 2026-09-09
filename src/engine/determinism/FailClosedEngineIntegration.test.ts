import { describe, expect, it } from "vitest";
import {
  BCCAAEngine,
  NoOpFactValidationProvider,
  type AnalyzeRequest,
} from "../BCCAAEngine";
import { makeTestUser } from "../testFixtures";
import {
  assertFailClosedBehavior,
  verifyFailClosedBehavior,
} from "./FailClosedBehaviorVerifier";

function makeRequest(
  factPattern = "The plaintiff relied on an unregistered bainapatra.",
): AnalyzeRequest {
  return {
    caseId: "P11-FAIL-CLOSED",
    user: makeTestUser(),
    license: {
      licenseId: "TEST-LICENSE",
      issuedTo: "P11-INTEGRATION",
    },
    input: {
      factPattern,
      submissionDate: "2024-01-15",
    },
  };
}

function makeEngine(overrides: {
  licenseValid?: boolean;
  factValidationProvider?: InstanceType<typeof NoOpFactValidationProvider>;
} = {}): BCCAAEngine {
  return new BCCAAEngine({
    licenseValidator: {
      validate: async () => ({
        valid: overrides.licenseValid ?? true,
        licenseId: "TEST-LICENSE",
        issuedTo: "P11-INTEGRATION",
        ...(overrides.licenseValid === false
          ? { reason: "TEST_LICENSE_DENIED" }
          : {}),
      }),
    },
    factValidationProvider:
      overrides.factValidationProvider ?? new NoOpFactValidationProvider(),
  });
}

describe("P11 actual engine fail-closed integration", () => {
  it("rejects a null runtime request without throwing", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(null as unknown as AnalyzeRequest);

    expect(
      verifyFailClosedBehavior(() => response).behavesCorrectly,
    ).toBe(true);
    expect(response.executionStatus).toBe("ERROR");
    expect(response.outcome).toBe("ERROR");
    expect(response.stage13.legalConclusions).toEqual([]);
  });

  it("rejects missing request.input without producing a legal conclusion", async () => {
    const engine = makeEngine();

    const request = makeRequest();
    delete (request as any).input;

    const response = await engine.analyze(request);

    expect(response.executionStatus).toBe("ERROR");
    expect(response.outcome).toBe("ERROR");
    expect(response.stage13.legalConclusions).toEqual([]);

    assertFailClosedBehavior(() => response);
  });

  it("rejects an empty fact pattern without producing a legal conclusion", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(makeRequest(""));

    expect(response.executionStatus).toBe("ERROR");
    expect(response.outcome).toBe("ERROR");
    expect(response.stage13.legalConclusions).toEqual([]);

    assertFailClosedBehavior(() => response);
  });

  it("rejects an invalid license without downstream legal conclusions", async () => {
    const engine = makeEngine({ licenseValid: false });

    const response = await engine.analyze(makeRequest());

    expect(response.executionStatus).toBe("ERROR");
    expect(response.outcome).toBe("ERROR");
    expect(response.stage13.legalConclusions).toEqual([]);
    expect((response.stage0.warnings ?? []).join(" ")).toContain("LICENSE_DENIED");

    assertFailClosedBehavior(() => response);
  });

  it("converts a fact-validation integrity exception into an engine error response", async () => {
    const throwingProvider = {
      validateFacts: async () => {
        throw new Error("P11_TEST_FACT_VALIDATION_FAILURE");
      },
    };

    const engine = new BCCAAEngine({
      licenseValidator: {
        validate: async () => ({
          valid: true,
          licenseId: "TEST-LICENSE",
          issuedTo: "P11-INTEGRATION",
        }),
      },
      factValidationProvider: throwingProvider,
    });

    const response = await engine.analyze(makeRequest());

    expect(response.executionStatus).toBe("ERROR");
    expect(response.outcome).toBe("ERROR");
    expect(response.stage13.legalConclusions).toEqual([]);

    assertFailClosedBehavior(() => response);
  });

  it("does not certify a normal successful response as fail-closed", async () => {
    const engine = makeEngine();

    const response = await engine.analyze(makeRequest());

    const result = verifyFailClosedBehavior(() => ({
      executionStatus: "COMPLETED",
      outcome: "STRUCTURAL_ONLY",
      stage13: {
        legalConclusions: response.stage13.legalConclusions,
      },
    }));

    expect(result.behavesCorrectly).toBe(false);
    expect(result.reason).toContain("expected BLOCKED/ERROR");
  });
});
