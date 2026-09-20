import { canonicalHash, compareCanonicalStrings } from "../../utils/crypto";
import type {
  AuthorityRecord,
  AuthorityRegistry,
  AuthorityRegistryIdentity,
} from "./AuthorityRegistry";

/**
 * N4-05: Deterministic Canonical Authority Registry Digest.
 *
 * Produces a deterministic SHA-256 digest from the canonical authority
 * registry contents.
 *
 * IMPORTANT:
 * - Digest proves identity/integrity, not legal correctness.
 * - Registry ordering is canonicalized by stable authorityId.
 * - Object field construction is explicit to prevent accidental metadata
 *   from entering the identity calculation.
 * - Runtime timestamps, random values, environment state, and audit
 *   metadata are never included.
 * - DEVELOPMENT_FIXTURE remains DEVELOPMENT_FIXTURE.
 */
export type CanonicalAuthorityRecord = {
  authorityId: string;
  kind: AuthorityRecord["kind"];
  actOrStatute?: string;
  sectionOrRule?: string;
  sourceId: string;
  citation: string;
  provenance: {
    sourceId: string;
    citation: string;
    provenanceUrl?: string;
    officialGazetteRef?: string;
  };
  validationStatus: AuthorityRecord["validationStatus"];
};

export type AuthorityRegistryDigest = {
  authorityRegistryVersion: string;
  authorityRegistryDigest: string;
};

function canonicalizeAuthority(
  authority: AuthorityRecord,
): CanonicalAuthorityRecord {
  return {
    authorityId: authority.authorityId,
    kind: authority.kind,
    ...(authority.actOrStatute !== undefined
      ? { actOrStatute: authority.actOrStatute }
      : {}),
    ...(authority.sectionOrRule !== undefined
      ? { sectionOrRule: authority.sectionOrRule }
      : {}),
    sourceId: authority.sourceId,
    citation: authority.citation,
    provenance: {
      sourceId: authority.provenance.sourceId,
      citation: authority.provenance.citation,
      ...(authority.provenance.provenanceUrl !== undefined
        ? { provenanceUrl: authority.provenance.provenanceUrl }
        : {}),
      ...(authority.provenance.officialGazetteRef !== undefined
        ? {
            officialGazetteRef:
              authority.provenance.officialGazetteRef,
          }
        : {}),
    },
    validationStatus: authority.validationStatus,
  };
}

export function canonicalizeAuthorityRegistry(
  registry: AuthorityRegistry,
): readonly CanonicalAuthorityRecord[] {
  return [...registry.getAuthorities()]
    .map(canonicalizeAuthority)
    .sort((a, b) => compareCanonicalStrings(a.authorityId, b.authorityId));
}

export function computeAuthorityRegistryDigest(
  registry: AuthorityRegistry,
): string {
  return canonicalHash(canonicalizeAuthorityRegistry(registry));
}

export function computeAuthorityRegistryIdentity(
  registry: AuthorityRegistry,
): AuthorityRegistryDigest {
  return {
    authorityRegistryVersion: registry.identity.authorityRegistryVersion,
    authorityRegistryDigest: computeAuthorityRegistryDigest(registry),
  };
}

/**
 * Returns the computed deterministic identity without mutating the registry.
 */
export function verifyAuthorityRegistryIdentity(
  registry: AuthorityRegistry,
): boolean {
  const computed = computeAuthorityRegistryIdentity(registry);

  return (
    computed.authorityRegistryVersion ===
      registry.identity.authorityRegistryVersion &&
    computed.authorityRegistryDigest ===
      registry.identity.authorityRegistryDigest
  );
}

/**
 * Explicit helper for consumers that need the repository's canonical
 * AuthorityRegistryIdentity shape.
 */
export function getComputedAuthorityRegistryIdentity(
  registry: AuthorityRegistry,
): AuthorityRegistryIdentity {
  return computeAuthorityRegistryIdentity(registry);
}
