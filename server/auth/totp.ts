import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const SECRET_BYTES = 20;

function getMfaEncryptionKey(): Buffer {
  const encoded = process.env.MFA_SECRET_KEY?.trim();

  if (!encoded) {
    throw new Error("MFA_SECRET_KEY_NOT_CONFIGURED");
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error("MFA_SECRET_KEY_MUST_BE_32_BYTES_BASE64");
  }

  return key;
}

function base32Encode(input: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = input
    .replace(/=+$/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const index = alphabet.indexOf(char);

    if (index < 0) {
      throw new Error("INVALID_TOTP_SECRET");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);

  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", secret)
    .update(counterBuffer)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;

  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

export interface TotpVerificationResult {
  valid: boolean;
  counter: number | null;
}

export function verifyTotp(
  secretText: string,
  token: string,
  timestampMs = Date.now(),
): TotpVerificationResult {
  if (!/^\d{6}$/.test(token)) {
    return {
      valid: false,
      counter: null,
    };
  }

  const secret = base32Decode(secretText);

  const counter = Math.floor(
    timestampMs / 1000 / TOTP_PERIOD_SECONDS,
  );

  /*
   * Small clock-skew window.
   *
   * Accept current, previous and next time step.
   * The accepted counter is returned so the persistence layer
   * can enforce one-time consumption and prevent replay.
   */
  for (const offset of [-1, 0, 1]) {
    const acceptedCounter = counter + offset;
    const expected = hotp(secret, acceptedCounter);

    if (expected === token) {
      return {
        valid: true,
        counter: acceptedCounter,
      };
    }
  }

  return {
    valid: false,
    counter: null,
  };
}

export function createOtpAuthUri(
  secret: string,
  email: string,
): string {
  const issuer = "BCCAA";

  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${encodeURIComponent(secret)}` +
    `&issuer=${encodeURIComponent(issuer)}` +
    `&algorithm=SHA1` +
    `&digits=${TOTP_DIGITS}` +
    `&period=${TOTP_PERIOD_SECONDS}`
  );
}

export function encryptTotpSecret(secret: string): string {
  const key = getMfaEncryptionKey();
  const iv = randomBytes(12);

  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptTotpSecret(payload: string): string {
  const key = getMfaEncryptionKey();
  const parts = payload.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("INVALID_MFA_SECRET_CIPHERTEXT");
  }

  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const ciphertext = Buffer.from(parts[3], "base64url");

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    iv,
  );

  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
