import { describe, expect, it } from "vitest";
import { DevelopmentAuthorityRegistry } from "./DevelopmentAuthorityRegistry";
import {
  canonicalizeAuthorityRegistry,
  computeAuthorityRegistryDigest,
  computeAuthorityRegistryIdentity,
  getComputedAuthorityRegistryIdentity,
  verifyAuthorityRegistryIdentity,
} from "./AuthorityRegistryHasher";

describe("N4-05 Authority Registry Digest", () => {
  it("produces a deterministic digest", () => {
    const first = new DevelopmentAuthorityRegistry();
    const second = new DevelopmentAuthorityRegistry();

    expect(computeAuthorityRegistryDigest(first)).toBe(
      computeAuthorityRegistryDigest(second),
    );
  });

  it("canonicalizes authorities by stable authorityId", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const canonical = canonicalizeAuthorityRegistry(registry);

    expect(canonical.map((authority) => authority.authorityId)).toEqual(
      [...canonical]
        .map((authority) => authority.authorityId)
        .sort((a, b) => a.localeCompare(b)),
    );
  });

  it("produces a SHA-256-compatible 64-character hexadecimal digest", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const digest = computeAuthorityRegistryDigest(registry);

    expect(digest).toMatch(/^[0-9a-f]{64}$/i);
  });

  it("includes the registry version in the computed identity", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const identity = computeAuthorityRegistryIdentity(registry);

    expect(identity.authorityRegistryVersion).toBe(
      "DEVELOPMENT-AUTHORITY-1.0.0",
    );
  });

  it("returns the same computed identity through both identity helpers", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(getComputedAuthorityRegistryIdentity(registry)).toEqual(
      computeAuthorityRegistryIdentity(registry),
    );
  });

  it("does not mutate the source registry ordering", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const before = registry
      .getAuthorities()
      .map((authority) => authority.authorityId);

    canonicalizeAuthorityRegistry(registry);

    expect(registry.getAuthorities().map((authority) => authority.authorityId))
      .toEqual(before);
  });

  it("fails identity verification for the development placeholder digest", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.identity.authorityRegistryDigest).toBe(
      "DEVELOPMENT-NOT-VERIFIED",
    );

    expect(verifyAuthorityRegistryIdentity(registry)).toBe(false);
  });

  it("does not depend on runtime timestamps or random values", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const first = computeAuthorityRegistryDigest(registry);

    const second = computeAuthorityRegistryDigest(registry);

    expect(first).toBe(second);
  });
});
