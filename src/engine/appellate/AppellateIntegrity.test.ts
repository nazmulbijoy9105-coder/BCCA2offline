import { describe, expect, it } from "vitest";

import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";
import {
  assertAppellateCorpusHash,
  getAppellateCorpusHash,
} from "./AppellateCorpusHasher";
import {
  assertAppellateIntegrity,
  verifyAppellateIntegrity,
} from "./AppellateIntegrityVerifier";
import {
  assertAppellateRegistryVersion,
  getAppellateRegistryVersion,
} from "./AppellateVersionLock";

describe("P9 Appellate Integrity", () => {
  it("identifies the registry as a development fixture", () => {
    const registry = new DevelopmentAppellateRegistry();

    expect(registry.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(registry.version).toBeTruthy();
  });

  it("passes structural integrity without claiming legal authority", () => {
    expect(verifyAppellateIntegrity()).toEqual({
      isValid: true,
      errors: [],
    });

    expect(() => assertAppellateIntegrity()).not.toThrow();
  });

  it("locks the registry version to the registry metadata", () => {
    const version = getAppellateRegistryVersion();

    expect(version).toBe("1.0-fixture");
    expect(() => assertAppellateRegistryVersion(version)).not.toThrow();
    expect(() =>
      assertAppellateRegistryVersion("incorrect-version"),
    ).toThrow(/Appellate Registry Version Mismatch/);
  });

  it("produces a deterministic browser-safe canonical SHA-256 hash", async () => {
    const first = await getAppellateCorpusHash();
    const second = await getAppellateCorpusHash();

    expect(first).toMatch(/^[0-9A-F]{64}$/);
    expect(first).toBe(second);
    await expect(assertAppellateCorpusHash(first)).resolves.not.toThrow();
  });

  it("fails closed when the expected corpus hash is incorrect", async () => {
    await expect(
      assertAppellateCorpusHash("0".repeat(64)),
    ).rejects.toThrow(/Appellate Corpus Hash Mismatch/);
  });

  it("preserves the asynchronous public hashing API", async () => {
    const result = getAppellateCorpusHash();

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatch(/^[0-9A-F]{64}$/);
  });
});
