import { describe, expect, it } from "vitest";
import {
  canonicalHash,
  canonicalStringify,
  generateHash,
  generateSecureId,
  hashPassword,
  isSha256Hash,
  verifyPassword,
} from "./crypto";

describe("P0 cryptographic security", () => {
  it("uses SHA-256 for generateHash", () => {
    const hash = generateHash("BCCAA");

    expect(hash).toHaveLength(64);
    expect(isSha256Hash(hash)).toBe(true);

    // SHA-256("BCCAA")
    expect(hash).toBe(
      "595616EF1B314B94409FB12B52CE1E47CA3D2379A6252417E558FA8B6CE2BFC3",
    );
  });

  it("produces deterministic SHA-256 hashes", () => {
    expect(generateHash("hello")).toBe(generateHash("hello"));
    expect(generateHash("hello")).not.toBe(generateHash("hello!"));
  });

  it("canonicalizes object keys deterministically", () => {
    expect(
      canonicalStringify({ b: 2, a: 1 }),
    ).toBe(
      canonicalStringify({ a: 1, b: 2 }),
    );

    expect(
      canonicalHash({ b: 2, a: 1 }),
    ).toBe(
      canonicalHash({ a: 1, b: 2 }),
    );
  });

  it("generates cryptographically random IDs", () => {
    const a = generateSecureId();
    const b = generateSecureId();

    expect(a).not.toBe(b);
    expect(a).toMatch(/^BCCAA-[0-9A-F]{32}$/);
    expect(b).toMatch(/^BCCAA-[0-9A-F]{32}$/);
  });

  it("generates salted password hashes", () => {
    const a = hashPassword("StrongPassword123!");
    const b = hashPassword("StrongPassword123!");

    expect(a).not.toBe(b);
    expect(a).toMatch(
      /^BCCAA_PBKDF2_v1\$310000\$[0-9A-F]{32}\$[0-9A-F]{64}$/,
    );
    expect(b).toMatch(
      /^BCCAA_PBKDF2_v1\$310000\$[0-9A-F]{32}\$[0-9A-F]{64}$/,
    );
  });

  it("verifies the correct password", () => {
    const stored = hashPassword("CorrectPassword123!");

    expect(
      verifyPassword("CorrectPassword123!", stored),
    ).toBe(true);

    expect(
      verifyPassword("WrongPassword123!", stored),
    ).toBe(false);
  });

  it("fails closed for malformed password hashes", () => {
    expect(
      verifyPassword("anything", ""),
    ).toBe(false);

    expect(
      verifyPassword("anything", "BCCAA_HASH_PBKDF_fake"),
    ).toBe(false);

    expect(
      verifyPassword("anything", "not-a-valid-hash"),
    ).toBe(false);
  });

  it("rejects empty passwords", () => {
    expect(() => hashPassword("")).toThrow();
  });
});
