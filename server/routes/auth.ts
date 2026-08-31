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
    ).catch(() => undefined);

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
    ).catch(() => undefined);

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
    ).catch(() => undefined);

      return res.status(403).json({
        error: "ACCOUNT_UNAVAILABLE",
      });
    }

    const validPassword = await verifyPassword(
      password,
      user.password_hash,
    );

    if (!validPassword) {
      const lockoutResult = await db.query<{
        failed_login_count: number;
        locked_until: Date | null;
      }>(
        `
          UPDATE users
          SET
            failed_login_count = failed_login_count + 1,
            locked_until = CASE
              WHEN failed_login_count + 1 >= $2
                THEN NOW() + ($3 * INTERVAL '1 minute')
              ELSE locked_until
            END,
            updated_at = NOW()
          WHERE id = $1
          RETURNING failed_login_count, locked_until
        `,
        [user.id, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES],
      );

      const isNowLocked =
        lockoutResult.rows[0].locked_until !== null &&
        lockoutResult.rows[0].locked_until.getTime() > Date.now();

      await recordSecurityEvent(
        "LOGIN",
        "DENIED",
        user.tenant_id,
        user.id,
        req.requestId,
        {
          reason: "invalid_password",
          failedLoginCount: lockoutResult.rows[0].failed_login_count,
          locked: isNowLocked,
        },
      ).catch(() => undefined);

      if (isNowLocked) {
        return res.status(423).json({
          error: "ACCOUNT_LOCKED",
        });
      }

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
  ).catch(() => undefined);

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
    ).catch(() => undefined);

      return res.status(403).json({
        error: "MFA_NOT_CONFIGURED",
      });
    }

    const secret = decryptTotpSecret(
      result.rows[0].mfa_secret_ciphertext,
    );

    const totp = verifyTotp(secret, token);

    const client = await db.connect();

    let outcome:
      | "SUCCESS"
      | "INVALID"
      | "REPLAY"
      | "LOCKED"
      | "SESSION_INVALID" = "INVALID";

    let acceptedCounter: number | null = null;
    let lockUntil: Date | null = null;

    try {
      await client.query("BEGIN");

      /*
       * Lock ordering is deliberately fixed:
       *   1. user
       *   2. session
       *
       * This prevents concurrent MFA requests from racing on
       * attempt counters, lockout state, or TOTP consumption.
       */
      const userState = await client.query<{
        id: string;
        tenant_id: string;
        is_active: boolean;
        mfa_required: boolean;
        mfa_enabled: boolean;
        mfa_failed_attempt_count: number;
        mfa_locked_until: Date | null;
        mfa_last_accepted_counter: string | number | null;
      }>(
        `
          SELECT
            id,
            tenant_id,
            is_active,
            mfa_required,
            mfa_enabled,
            mfa_failed_attempt_count,
            mfa_locked_until,
            mfa_last_accepted_counter
          FROM users
          WHERE id = $1
            AND tenant_id = $2
          FOR UPDATE
        `,
        [user.id, user.tenantId],
      );

      if (userState.rows.length !== 1) {
        outcome = "SESSION_INVALID";
        await client.query("ROLLBACK");
      } else {
        const currentUser = userState.rows[0];

        const sessionState = await client.query<{
          id: string;
          user_id: string;
          tenant_id: string;
          mfa_verified: boolean;
          mfa_verified_at: Date | null;
          mfa_failed_attempt_count: number;
          mfa_locked_until: Date | null;
          mfa_last_accepted_counter: string | number | null;
          expires_at: Date;
          revoked_at: Date | null;
        }>(
          `
            SELECT
              id,
              user_id,
              tenant_id,
              mfa_verified,
              mfa_verified_at,
              mfa_failed_attempt_count,
              mfa_locked_until,
              mfa_last_accepted_counter,
              expires_at,
              revoked_at
            FROM sessions
            WHERE id = $1
              AND user_id = $2
              AND tenant_id = $3
            FOR UPDATE
          `,
          [
            authSession.id,
            user.id,
            user.tenantId,
          ],
        );

        if (sessionState.rows.length !== 1) {
          outcome = "SESSION_INVALID";
          await client.query("ROLLBACK");
        } else {
          const currentSession = sessionState.rows[0];
          const now = Date.now();

          const userLocked =
            currentUser.mfa_locked_until &&
            currentUser.mfa_locked_until.getTime() > now;

          const sessionLocked =
            currentSession.mfa_locked_until &&
            currentSession.mfa_locked_until.getTime() > now;

          if (
            !currentUser.is_active ||
            !currentSession.expires_at ||
            currentSession.expires_at.getTime() <= now ||
            currentSession.revoked_at !== null ||
            currentSession.mfa_verified
          ) {
            outcome = "SESSION_INVALID";
            await client.query("ROLLBACK");
          } else if (userLocked || sessionLocked) {
            lockUntil =
              currentUser.mfa_locked_until &&
              currentUser.mfa_locked_until.getTime() > now
                ? currentUser.mfa_locked_until
                : currentSession.mfa_locked_until;

            outcome = "LOCKED";
            await client.query("ROLLBACK");
          } else if (
            !totp.valid ||
            totp.counter === null
          ) {
            const nextSessionAttempts =
              currentSession.mfa_failed_attempt_count + 1;

            const nextUserAttempts =
              currentUser.mfa_failed_attempt_count + 1;

            const shouldLock =
              nextSessionAttempts >= 5 ||
              nextUserAttempts >= 5;

            const newLockUntil = shouldLock
              ? new Date(Date.now() + 15 * 60 * 1000)
              : null;

            await client.query(
              `
                UPDATE sessions
                SET
                  mfa_failed_attempt_count = $1,
                  mfa_locked_until = $2
                WHERE id = $3
              `,
              [
                nextSessionAttempts,
                newLockUntil,
                currentSession.id,
              ],
            );

            await client.query(
              `
                UPDATE users
                SET
                  mfa_failed_attempt_count = $1,
                  mfa_locked_until = $2,
                  updated_at = NOW()
                WHERE id = $3
              `,
              [
                nextUserAttempts,
                newLockUntil,
                currentUser.id,
              ],
            );

            await client.query("COMMIT");

            outcome = shouldLock ? "LOCKED" : "INVALID";
            lockUntil = newLockUntil;
          } else {
            const sessionPreviousCounter =
              currentSession.mfa_last_accepted_counter === null
                ? null
                : BigInt(
                    currentSession.mfa_last_accepted_counter,
                  );

            const userPreviousCounter =
              currentUser.mfa_last_accepted_counter === null
                ? null
                : BigInt(
                    currentUser.mfa_last_accepted_counter,
                  );

            const candidateCounter = BigInt(totp.counter);

            /*
             * USER-SCOPED replay barrier is authoritative.
             *
             * Because the user row is locked FOR UPDATE above,
             * concurrent sessions for this user cannot both
             * consume the same TOTP counter.
             *
             * The session counter remains defense-in-depth.
             */
            if (
              (userPreviousCounter !== null &&
                candidateCounter <= userPreviousCounter) ||
              (sessionPreviousCounter !== null &&
                candidateCounter <= sessionPreviousCounter)
            ) {
              outcome = "REPLAY";
              await client.query("ROLLBACK");
            } else {
              acceptedCounter = totp.counter;

              const sessionUpdate = await client.query(
                `
                  UPDATE sessions
                  SET
                    mfa_verified = TRUE,
                    mfa_verified_at = NOW(),
                    last_seen_at = NOW(),
                    mfa_failed_attempt_count = 0,
                    mfa_locked_until = NULL,
                    mfa_last_accepted_counter = $1
                  WHERE id = $2
                    AND user_id = $3
                    AND tenant_id = $4
                    AND mfa_verified = FALSE
                    AND revoked_at IS NULL
                    AND expires_at > NOW()
                  RETURNING id
                `,
                [
                  acceptedCounter,
                  currentSession.id,
                  currentUser.id,
                  currentUser.tenant_id,
                ],
              );

              if (sessionUpdate.rows.length !== 1) {
                outcome = "SESSION_INVALID";
                await client.query("ROLLBACK");
              } else {
                const userUpdate = await client.query(
                  `
                    UPDATE users
                    SET
                      mfa_last_verified_at = NOW(),
                      mfa_last_accepted_counter = $1,
                      mfa_failed_attempt_count = 0,
                      mfa_locked_until = NULL,
                      updated_at = NOW()
                    WHERE id = $2
                      AND tenant_id = $3
                  `,
                  [
                    acceptedCounter,
                    currentUser.id,
                    currentUser.tenant_id,
                  ],
                );

                if (userUpdate.rowCount !== 1) {
                  outcome = "SESSION_INVALID";
                  await client.query("ROLLBACK");
                } else {
                  await client.query("COMMIT");

                  outcome = "SUCCESS";
                }
              }
            }
          }
        }
      }
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    if (outcome === "LOCKED") {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        {
          reason: "mfa_locked",
        },
    ).catch(() => undefined);

      return res.status(429).json({
        error: "MFA_LOCKED",
        retryAfterSeconds: lockUntil
          ? Math.max(
              1,
              Math.ceil(
                (lockUntil.getTime() - Date.now()) / 1000,
              ),
            )
          : 900,
      });
    }

    if (outcome === "REPLAY") {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        {
          reason: "totp_replay",
        },
    ).catch(() => undefined);

      return res.status(401).json({
        error: "INVALID_MFA_CODE",
      });
    }

    if (outcome === "INVALID") {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        {
          reason: "invalid_code",
        },
    ).catch(() => undefined);

      return res.status(401).json({
        error: "INVALID_MFA_CODE",
      });
    }

    if (outcome === "SESSION_INVALID") {
      await recordSecurityEvent(
        "MFA_VERIFY",
        "DENIED",
        user.tenantId,
        user.id,
        req.requestId,
        {
          reason: "session_update_failed",
        },
    ).catch(() => undefined);

      return res.status(401).json({
        error: "MFA_SESSION_INVALID",
      });
    }

    await recordSecurityEvent(
      "MFA_VERIFY",
      "SUCCESS",
      user.tenantId,
      user.id,
      req.requestId,
      {
        sessionId: authSession.id,
        acceptedCounter,
      },
  ).catch(() => undefined);

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
