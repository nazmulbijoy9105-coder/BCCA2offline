import { Router } from "express";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "../auth/password";
import {
  clearSessionCookie,
  createSession,
  getSessionCookieName,
  revokeSession,
} from "../auth/session";
import { authenticate, authenticateMfaPending } from "../middleware/authenticate";
import { decryptTotpSecret, verifyTotp } from "../auth/totp";
import { db } from "../db/pool";

const router = Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  if (
    email.length < 3 ||
    email.length > 254 ||
    !email.includes("@")
  ) {
    return null;
  }

  return email;
}

function isValidPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 1024
  );
}

async function recordSecurityEvent(
  action: string,
  result: string,
  tenantId: string | null,
  actorUserId: string | null,
  requestId: string | undefined,
  metadata: Record<string, unknown> = {},
) {
  await db.query(
    `
      INSERT INTO security_events (
        id,
        tenant_id,
        actor_user_id,
        action,
        result,
        request_id,
        resource_type,
        metadata
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::jsonb
      )
    `,
    [
      randomUUID(),
      tenantId,
      actorUserId,
      action,
      result,
      requestId || null,
      "authentication",
      JSON.stringify(metadata),
    ],
  );
}

router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || !isValidPassword(password)) {
    return res.status(400).json({
      error: "INVALID_CREDENTIALS",
    });
  }

  try {
    const result = await db.query<{
      id: string;
      tenant_id: string;
      email: string;
      password_hash: string;
      role: "super_admin" | "admin" | "user";
      is_active: boolean;
      mfa_required: boolean;
      mfa_enabled: boolean;
      failed_login_count: number;
      locked_until: Date | null;
      tenant_status: "active" | "suspended" | "revoked";
    }>(
      `
        SELECT
          u.id,
          u.tenant_id,
          u.email,
          u.password_hash,
          u.role,
          u.is_active,
          u.mfa_required,
          u.mfa_enabled,
          u.failed_login_count,
          u.locked_until,
          t.status AS tenant_status
        FROM users u
        INNER JOIN tenants t
          ON t.id = u.tenant_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [email],
    );

    if (result.rows.length !== 1) {
      await recordSecurityEvent(
        "LOGIN",
        "DENIED",
        null,
        null,
        req.requestId,
        { reason: "invalid_credentials" },
      );

      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    const user = result.rows[0];

    if (
      user.locked_until &&
      user.locked_until.getTime() > Date.now()
    ) {
      await recordSecurityEvent(
        "LOGIN",
        "DENIED",
        user.tenant_id,
        user.id,
        req.requestId,
        { reason: "account_locked" },
      );

      return res.status(423).json({
        error: "ACCOUNT_LOCKED",
      });
    }

    if (
      !user.is_active ||
      user.tenant_status !== "active"
    ) {
      await recordSecurityEvent(
        "LOGIN",
        "DENIED",
        user.tenant_id,
        user.id,
        req.requestId,
        { reason: "account_or_tenant_inactive" },
      );

      return res.status(403).json({
        error: "ACCOUNT_UNAVAILABLE",
      });
    }

    const validPassword = await verifyPassword(
      password,
      user.password_hash,
    );

    if (!validPassword) {
      const nextFailedCount = user.failed_login_count + 1;

      if (nextFailedCount >= MAX_LOGIN_ATTEMPTS) {
        await db.query(
          `
            UPDATE users
            SET
              failed_login_count = 0,
              locked_until = NOW() + ($2 * INTERVAL '1 minute'),
              updated_at = NOW()
            WHERE id = $1
          `,
          [user.id, LOCKOUT_MINUTES],
        );
      } else {
        await db.query(
          `
            UPDATE users
            SET
              failed_login_count = $2,
              updated_at = NOW()
            WHERE id = $1
          `,
          [user.id, nextFailedCount],
        );
      }

      await recordSecurityEvent(
        "LOGIN",
        "DENIED",
        user.tenant_id,
        user.id,
        req.requestId,
        { reason: "invalid_password" },
      );

      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    await db.query(
      `
        UPDATE users
        SET
          failed_login_count = 0,
          locked_until = NULL,
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [user.id],
    );

    const authenticatedUser = {
      id: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      mfaRequired: user.mfa_required,
      mfaEnabled: user.mfa_enabled,
    };

    const mfaRequired =
      user.mfa_required ||
      user.mfa_enabled;

    const session = await createSession(
      authenticatedUser,
      res,
      !mfaRequired,
    );

    await recordSecurityEvent(
      "LOGIN",
      mfaRequired ? "MFA_REQUIRED" : "SUCCESS",
      user.tenant_id,
      user.id,
      req.requestId,
      {
        mfaRequired,
        sessionId: session.id,
      },
    );

    return res.status(200).json({
      authenticated: !mfaRequired,
      mfaRequired,
      mfaVerified: session.mfaVerified,
      user: authenticatedUser,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      error: "AUTHENTICATION_SERVICE_ERROR",
    });
  }
});


router.post("/mfa/verify", authenticateMfaPending, async (req, res) => {
  const token = req.body?.token;

  if (
    typeof token !== "string" ||
    !/^\d{6}$/.test(token)
  ) {
    return res.status(400).json({
      error: "INVALID_MFA_CODE",
    });
  }

  const user = req.auth;
  const authSession = req.authSession;

  if (!user || !authSession) {
    return res.status(401).json({
      error: "UNAUTHENTICATED",
    });
  }

  try {
    const result = await db.query<{
      mfa_secret_ciphertext: string | null;
    }>(
      `
        SELECT mfa_secret_ciphertext
        FROM users
        WHERE id = $1
          AND tenant_id = $2
          AND is_active = TRUE
        LIMIT 1
      `,
      [user.id, user.tenantId],
    );

    if (
      result.rows.length !== 1 ||
      !result.rows[0].mfa_secret_ciphertext
    ) {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        { reason: "mfa_secret_unavailable" },
      );

      return res.status(403).json({
        error: "MFA_NOT_CONFIGURED",
      });
    }

    const secret = decryptTotpSecret(
      result.rows[0].mfa_secret_ciphertext,
    );

    const valid = verifyTotp(secret, token);

    if (!valid) {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        { reason: "invalid_code" },
      );

      return res.status(401).json({
        error: "INVALID_MFA_CODE",
      });
    }

    const verified = await db.query(
      `
        UPDATE sessions
        SET
          mfa_verified = TRUE,
          mfa_verified_at = NOW(),
          last_seen_at = NOW()
        WHERE id = $1
          AND user_id = $2
          AND tenant_id = $3
          AND revoked_at IS NULL
          AND expires_at > NOW()
          AND mfa_verified = FALSE
        RETURNING id
      `,
      [
        authSession.id,
        user.id,
        user.tenantId,
      ],
    );

    if (verified.rows.length !== 1) {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        { reason: "session_update_failed" },
      );

      return res.status(401).json({
        error: "MFA_SESSION_INVALID",
      });
    }

    await db.query(
      `
        UPDATE users
        SET
          mfa_last_verified_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
      `,
      [user.id],
    );

    await recordSecurityEvent(
      "MFA_VERIFY",
      "SUCCESS",
      user.tenantId,
      user.id,
      req.requestId,
      { sessionId: authSession.id },
    );

    return res.status(200).json({
      authenticated: true,
      mfaRequired: true,
      mfaVerified: true,
      user,
    });
  } catch (error) {
    console.error("MFA verification failed:", error);

    await recordSecurityEvent(
      "MFA_VERIFY",
      "ERROR",
      user.tenantId,
      user.id,
      req.requestId,
      { reason: "verification_service_error" },
    ).catch(() => undefined);

    return res.status(500).json({
      error: "MFA_SERVICE_ERROR",
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const rawToken =
      req.cookies?.[getSessionCookieName()];

    await revokeSession(rawToken);

    clearSessionCookie(res);

    return res.status(204).send();
  } catch (error) {
    console.error("Logout failed:", error);

    clearSessionCookie(res);

    return res.status(204).send();
  }
});

router.get("/me", authenticate, async (req, res) => {
  return res.status(200).json({
    authenticated: true,
    user: req.auth,
  });
});

export default router;
