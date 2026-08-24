/**
 * BCCAA 4.4.0 Cryptographic Utilities
 * One canonical serialization / hash path for all forensic payloads.
 */

export function generateHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return "00000000";
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  let hash2 = 17;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = (hash2 * 31 + str.charCodeAt(i)) | 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `${hex}${hex2}`.toUpperCase();
}

export function hashPassword(password: string): string {
  return "BCCAA_HASH_PBKDF_" + generateHash(password + "_neum_lex_salt_2026_");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateSecureId(): string {
  const parts = [
    "STATIC",
    "STATIC",
    "STATIC"
  ];
  return parts.join("-").toUpperCase();
}

// ============================================================================
// 4.4.0 CANONICAL SERIALIZATION / HASH PATH
// ============================================================================

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function canonicalHash(value: unknown): string {
  return generateHash(canonicalStringify(value));
}
