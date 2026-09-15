import { describe, expect, it } from "vitest";
import {
  DevelopmentAuthorityRegistry,
} from "./DevelopmentAuthorityRegistry";
import {
  canonicalizeAuthorityRegistry,
  computeAuthorityRegistryDigest,
  computeAuthorityRegistryIdentity,
  verifyAuthorityRegistryIdentity,
} from "./AuthorityRegistryHasher";
import type {
  AuthorityRecord,
  AuthorityRegistry,
} from "./AuthorityRegistry";

function createRegistry(
  authorities: readonly AuthorityRecord[],
): AuthorityRegistry {
  return {
    identity: {
      authorityRegistryVersion: "TEST-AUTHORITY-1.0.0",
      authorityRegistryDigest:
        computeAuthorityRegistryDigest({
          identity: {
            authorityRegistryVersion: "TEST-AUTHORITY-1.0.0",
            authorityRegistryDigest: "TEST",
          },
          authorityStatus: "DEVELOPMENT_FIXTURE",
          getAuthorities: () => authorities,
          getAuthorityById: (authorityId) =>
            authorities.find(
              (authority) => authority.authorityId === authorityId,
            ) ?? null,
          getAuthorityBySourceId: (sourceId) =>
            authorities.find(
              (authority) => authority.sourceId === sourceId,
            ) ?? null,
        }),
    },
    authorityStatus: "DEVELOPMENT_FIXTURE",
    getAuthorities: () => authorities,
    getAuthorityById: (authorityId) =>
      authorities.find(
        (authority) => authority.authorityId === authorityId,
      ) ?? null,
    getAuthorityBySourceId: (sourceId) =>
      authorities.find(
        (authority) => authority.sourceId === sourceId,
      ) ?? null,
  };
}

describe("N4-06 Authority Registry Integrity", () => {
  it("produces identical digests for independently created equivalent registries", () => {
    const first = new DevelopmentAuthorityRegistry();
    const second = new DevelopmentAuthorityRegistry();

    expect(computeAuthorityRegistryDigest(first)).toBe(
      computeAuthorityRegistryDigest(second),
    );
  });

  it("is invariant to authority record ordering", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const authorities = [...registry.getAuthorities()];

    const reversed = createRegistry([...authorities].reverse());

    expect(computeAuthorityRegistryDigest(registry)).toBe(
      computeAuthorityRegistryDigest(reversed),
    );
  });

  it("changes the digest when an authoritative registry field changes", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const authorities = [...registry.getAuthorities()];

    const original = computeAuthorityRegistryDigest(registry);

    const modifiedAuthorities = authorities.map((authority, index) =>
      index === 0
        ? {
            ...authority,
            citation: `${authority.citation} MODIFIED`,
          }
        : authority,
    );

    const modified = createRegistry(modifiedAuthorities);

    expect(computeAuthorityRegistryDigest(modified)).not.toBe(original);
  });

  it("changes the digest when validation status changes", () => {
    const registry = new DevelopmentAuthorityRegistry();
    const authorities = [...registry.getAuthorities()];

    const original = computeAuthorityRegistryDigest(registry);

    const modifiedAuthorities = authorities.map((authority, index) =>
      index === 0
        ? {
            ...authority,
            validationStatus: "SOURCE_VERIFIED" as const,
          }
        : authority,
    );

    const modified = createRegistry(modifiedAuthorities);

    expect(computeAuthorityRegistryDigest(modified)).not.toBe(original);
  });

  it("does not include runtime-only timestamps or random values", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const digest1 = computeAuthorityRegistryDigest(registry);

    const authorities = registry.getAuthorities();
    const withRuntimeMetadata: AuthorityRegistry = {
      identity: registry.identity,
      authorityStatus: registry.authorityStatus,
      getAuthorities: () => authorities,
      getAuthorityById: (authorityId) =>
        registry.getAuthorityById(authorityId),
      getAuthorityBySourceId: (sourceId) =>
        registry.getAuthorityBySourceId(sourceId),
      auditTimestamp: new Date().toISOString(),
      runtimeRandom: Math.random(),
    } as AuthorityRegistry & {
      auditTimestamp: string;
      runtimeRandom: number;
    };

    const digest2 = computeAuthorityRegistryDigest(withRuntimeMetadata);

    expect(digest2).toBe(digest1);
  });

  it("keeps development fixtures outside production authority", () => {
    const registry = new DevelopmentAuthorityRegistry();

    expect(registry.authorityStatus).toBe("DEVELOPMENT_FIXTURE");
    expect(verifyAuthorityRegistryIdentity(registry)).toBe(false);
  });

  it("keeps the computed version and digest deterministic", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const first = computeAuthorityRegistryIdentity(registry);
    const second = computeAuthorityRegistryIdentity(registry);

    expect(first).toEqual(second);
    expect(first.authorityRegistryVersion).toBe(
      registry.identity.authorityRegistryVersion,
    );
  });

  it("canonicalization does not mutate the registry", () => {
    const registry = new DevelopmentAuthorityRegistry();

    const before = registry
      .getAuthorities()
      .map((authority) => authority.authorityId);

    canonicalizeAuthorityRegistry(registry);

    const after = registry
      .getAuthorities()
      .map((authority) => authority.authorityId);

    expect(after).toEqual(before);
  });
});
