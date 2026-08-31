import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Response } from "express";
import { db } from "../db/pool";
import type { AuthenticatedUser, SessionRecord } from "./types";

const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "__Host-bccaa_session"
    : "bccaa_session");

const DEFAULT_TTL_SECONDS = 8 * 60 * 60;
const MIN_TTL_SECONDS = 5 * 60;
const MAX_TTL_SECONDS = 24 * 60 * 60;

function sessionTtlSeconds(): number {
  const configured = Number(process.env.SESSION_TTL_SECONDS);

  if (!Number.isFinite(configured)) {
    return DEFAULT_TTL_SECONDS;
  }

  return Math.min(
    MAX_TTL_SECONDS,
    Math.max(MIN_TTL_SECONDS, Math.floor(configured)),
  );
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: sessionTtlSeconds() * 1000,
  };
}

export async function createSession(
  user: AuthenticatedUser,
  res: Response,
): Promise<SessionRecord> {
  const token = generateToken();
  const sessionHash = hashToken(token);
  const id = randomUUID();

  const ttl = sessionTtlSeconds();

  /*
   * MFA state is derived exclusively from server-side policy.
   *
   * MFA-required or MFA-enabled users always receive a
   * pending session. They can only become MFA-verified
   * through the authoritative /mfa/verify transaction.
   *
   * Users without MFA policy receive an immediately
   * authenticated session.
   */
  const effectiveMfaVerified =
    user.mfaRequired || user.mfaEnabled
      ? false
      : true;

  const result = await db.query<{
    id: string;
    user_id: string;
    tenant_id: string;
    expires_at: Date;
    mfa_verified: boolean;
    mfa_verified_at: Date | null;
  }>(
    `
      INSERT INTO sessions (
        id,
        user_id,
        tenant_id,
        session_hash,
        expires_at,
        mfa_verified,
        mfa_verified_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NOW() + ($5 * INTERVAL '1 second'),
        $6,
        CASE
          WHEN $6 = TRUE THEN NOW()
          ELSE NULL
        END
      )
      RETURNING
        id,
        user_id,
        tenant_id,
        expires_at,
        mfa_verified,
        mfa_verified_at
    `,
    [
      id,
      user.id,
      user.tenantId,
      sessionHash,
      ttl,
      effectiveMfaVerified,
    ],
  );

  if (result.rows.length !== 1) {
    throw new Error("SESSION_CREATION_FAILED");
  }

  res.cookie(
    getSessionCookieName(),
    token,
    cookieOptions(),
  );

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    expiresAt: row.expires_at,
    mfaVerified: row.mfa_verified,
    mfaVerifiedAt: row.mfa_verified_at,
  };
}

export async function resolveSession(
  rawToken: string | undefined,
): Promise<{
  session: SessionRecord;
  user: AuthenticatedUser;
} | null> {
  if (
    !rawToken ||
    typeof rawToken !== "string" ||
    rawToken.length < 40 ||
    rawToken.length > 256
  ) {
    return null;
  }

  const sessionHash = hashToken(rawToken);

  const result = await db.query<{
    session_id: string;
    session_user_id: string;
    session_tenant_id: string;
    session_expires_at: Date;
    session_mfa_verified: boolean;
    session_mfa_verified_at: Date | null;
    user_id: string;
    tenant_id: string;
    email: string;
    role: "super_admin" | "admin" | "user";
    is_active: boolean;
    mfa_required: boolean;
    mfa_enabled: boolean;
    tenant_status: "active" | "suspended" | "revoked";
  }>(
    `
      SELECT
        s.id AS session_id,
        s.user_id AS session_user_id,
        s.tenant_id AS session_tenant_id,
        s.expires_at AS session_expires_at,
        s.mfa_verified AS session_mfa_verified,
        s.mfa_verified_at AS session_mfa_verified_at,
        u.id AS user_id,
        u.tenant_id,
        u.email,
        u.role,
        u.is_active,
        u.mfa_required,
        u.mfa_enabled,
        t.status AS tenant_status
      FROM sessions s
      INNER JOIN users u
        ON u.id = s.user_id
      INNER JOIN tenants t
        ON t.id = s.tenant_id
      WHERE s.session_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
        AND t.status = 'active'
      LIMIT 1
    `,
    [sessionHash],
  );

  if (result.rows.length !== 1) {
    return null;
  }

  const row = result.rows[0];

  await db.query(
    `
      UPDATE sessions
      SET last_seen_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `,
    [row.session_id],
  );

  return {
    session: {
      id: row.session_id,
      userId: row.session_user_id,
      tenantId: row.session_tenant_id,
      expiresAt: row.session_expires_at,
      mfaVerified: row.session_mfa_verified,
      mfaVerifiedAt: row.session_mfa_verified_at,
    },
    user: {
      id: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      mfaRequired: row.mfa_required,
      mfaEnabled: row.mfa_enabled,
    },
  };
}

export async function revokeSession(
  rawToken: string | undefined,
): Promise<void> {
  if (
    !rawToken ||
    typeof rawToken !== "string" ||
    rawToken.length < 40 ||
    rawToken.length > 256
  ) {
    return;
  }

  const sessionHash = hashToken(rawToken);

  await db.query(
    `
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE session_hash = $1
        AND revoked_at IS NULL
    `,
    [sessionHash],
  );
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(getSessionCookieName(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}
