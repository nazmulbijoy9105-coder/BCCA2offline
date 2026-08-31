/**
 * BCCAA Cryptographic Utilities
 *
 * P0 SECURITY HARDENING
 *
 * Properties:
 * - SHA-256 for deterministic content hashing
 * - PBKDF2-HMAC-SHA-256 for password hashing
 * - Per-password random salts
 * - Cryptographically secure random identifiers
 * - Constant-time password verification
 *
 * IMPORTANT:
 * These functions are security primitives. Do not replace them with
 * custom hashes, Math.random(), timestamps, or static secrets.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { randomBytes } from "@noble/hashes/utils.js";

const PASSWORD_ALGORITHM = "PBKDF2-HMAC-SHA256";
const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 32;
const PASSWORD_FORMAT_VERSION = "v1";

const HASH_HEX_LENGTH = 64;

/**
 * Convert bytes to uppercase hexadecimal.
 */
function bytesToHex(bytes: Uint8Array): string {
  let output = "";

  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, "0");
  }

  return output.toUpperCase();
}

/**
 * Convert hexadecimal to bytes.
 */
function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    return null;
  }

  const output = new Uint8Array(hex.length / 2);

  for (let i = 0; i < output.length; i++) {
    output[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return output;
}

/**
 * Constant-time byte comparison.
 *
 * The comparison does not return early when bytes differ.
 */
function constantTimeEqual(
  left: Uint8Array,
  right: Uint8Array,
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < left.length; i++) {
    difference |= left[i] ^ right[i];
  }

  return difference === 0;
}

/**
 * SHA-256 hash of a string.
 *
 * This replaces the previous custom 32-bit hash.
 */
export function generateHash(str: string): string {
  return bytesToHex(
    sha256(new TextEncoder().encode(str)),
  );
}

/**
 * Secure password hash.
 *
 * Format:
 *
 * BCCAA_PBKDF2_v1$iterations$saltHex$keyHex
 *
 * Every password receives a new random salt.
 */
export function hashPassword(password: string): string {
  if (typeof password !== "string") {
    throw new TypeError("Password must be a string");
  }

  if (password.length === 0) {
    throw new Error("Password must not be empty");
  }

  const salt = randomBytes(PASSWORD_SALT_BYTES);

  const derivedKey = pbkdf2(
    sha256,
    new TextEncoder().encode(password),
    salt,
    {
      c: PASSWORD_ITERATIONS,
      dkLen: PASSWORD_KEY_BYTES,
    },
  );

  return [
    `BCCAA_PBKDF2_${PASSWORD_FORMAT_VERSION}`,
    PASSWORD_ITERATIONS.toString(),
    bytesToHex(salt),
    bytesToHex(derivedKey),
  ].join("$");
}

/**
 * Verify a password against a stored PBKDF2 record.
 *
 * Returns false for malformed or legacy hashes.
 */
export function verifyPassword(
  password: string,
  storedHash: string,
): boolean {
  if (
    typeof password !== "string" ||
    typeof storedHash !== "string"
  ) {
    return false;
  }

  const parts = storedHash.split("$");

  if (parts.length !== 4) {
    return false;
  }

  const [algorithm, iterationsText, saltHex, expectedHex] = parts;

  if (
    algorithm !== `BCCAA_PBKDF2_${PASSWORD_FORMAT_VERSION}`
  ) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 2_000_000
  ) {
    return false;
  }

  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(expectedHex);

  if (
    salt === null ||
    expected === null ||
    salt.length !== PASSWORD_SALT_BYTES ||
    expected.length !== PASSWORD_KEY_BYTES
  ) {
    return false;
  }

  const actual = pbkdf2(
    sha256,
    new TextEncoder().encode(password),
    salt,
    {
      c: iterations,
      dkLen: PASSWORD_KEY_BYTES,
    },
  );

  return constantTimeEqual(actual, expected);
}

/**
 * Cryptographically secure random identifier.
 *
 * No timestamps, Math.random(), or static values.
 */
export function generateSecureId(): string {
  return `BCCAA-${bytesToHex(randomBytes(16))}`;
}

// ============================================================================
// CANONICAL SERIALIZATION / HASH PATH
// ============================================================================

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};

    for (
      const key of Object.keys(value as Record<string, unknown>).sort()
    ) {
      out[key] = canonicalize(
        (value as Record<string, unknown>)[key],
      );
    }

    return out;
  }

  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

/**
 * SHA-256 hash over canonical JSON.
 */
export function canonicalHash(value: unknown): string {
  return generateHash(canonicalStringify(value));
}

/**
 * Internal sanity assertion for tests and defensive checks.
 */
export function isSha256Hash(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length === HASH_HEX_LENGTH &&
    /^[0-9A-F]+$/.test(value)
  );
}
