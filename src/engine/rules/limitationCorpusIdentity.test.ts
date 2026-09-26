import { describe, expect, it } from "vitest";
import { getCorpusHash } from "../citations/CorpusHasher";
import {
  getCorpusName,
  getCorpusVersion,
} from "../citations/CorpusVersionLock";
import { DevelopmentLimitationRegistry } from "./DevelopmentLimitationRegistry";

describe("P4-05 — Limitation corpus identity binding", () => {
  it("binds the limitation registry to the authoritative corpus identity", () => {
    const registry = new DevelopmentLimitationRegistry();

    expect(registry.identity).toEqual({
      corpusId: getCorpusName(),
      corpusVersion: getCorpusVersion(),
      corpusDigest: getCorpusHash(),
    });
  });

  it("uses the repository canonical SHA-256 corpus digest", () => {
    const registry = new DevelopmentLimitationRegistry();

    expect(registry.identity.corpusDigest).toBe(getCorpusHash());
    expect(registry.identity.corpusDigest).toMatch(/^[0-9A-F]{64}$/);
  });

  it("binds the expected Bangladesh Limitation Act corpus", () => {
    const registry = new DevelopmentLimitationRegistry();

    expect(registry.identity.corpusId).toBe(
      "Limitation_Act_1908_Bangladesh_KB",
    );
    expect(registry.identity.corpusVersion).toBe("1.0");
  });

  it("keeps corpus identity stable across registry instances", () => {
    const first = new DevelopmentLimitationRegistry();
    const second = new DevelopmentLimitationRegistry();

    expect(first.identity).toEqual(second.identity);
  });
});
