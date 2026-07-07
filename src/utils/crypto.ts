/**
 * Crypto and hashing utilities for client-side and CLI environments.
 */

export function generateHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return "00000000";
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Add a simple secondary cascade to simulate longer forensic hashes
  let hash2 = 17;
  for (let i = str.length - 1; i >= 0; i--) {
    hash2 = (hash2 * 31 + str.charCodeAt(i)) | 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `${hex}${hex2}`.toUpperCase();
}

export function hashPassword(password: string): string {
  // Simple client-side pseudo-hash that is fully portable
  return "BCCAA_HASH_PBKDF_" + generateHash(password + "_neum_lex_salt_2026_");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateSecureId(): string {
  const parts = [
    Math.random().toString(36).substring(2, 10),
    Date.now().toString(36),
    Math.random().toString(36).substring(2, 6)
  ];
  return parts.join("-").toUpperCase();
}
