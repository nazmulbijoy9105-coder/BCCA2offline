import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../db/pool";
import { hashPassword } from "./password";

const RESET_TOKEN_TTL_MINUTES = 30;

function hashResetToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

function isValidResetToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 40 &&
    value.length <= 256
  );
}

function isValidNewPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 1024
  );
}

export {
  generateResetToken,
  hashResetToken,
  isValidResetToken,
  isValidNewPassword,
};

export async function createPasswordResetToken(
  email: string,
): Promise<{
  token: string | null;
  userId: string | null;
  tenantId: string | null;
}> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    /*
     * Lock the candidate user row for the entire reset-token
     * issuance transaction. This serializes concurrent reset
     * requests for the same account.
     *
     * The tenant is resolved from the locked user row and must
     * also be active. No client-supplied tenant identity is used.
     */
    const result = await client.query<{
      id: string;
      tenant_id: string;
    }>(
      `
        SELECT
          u.id,
          u.tenant_id
        FROM users u
        INNER JOIN tenants t
          ON t.id = u.tenant_id
        WHERE u.email = $1
          AND u.is_active = TRUE
          AND t.status = 'active'
        FOR UPDATE OF u
      `,
      [email],
    );

    /*
     * Enumeration-resistant behavior:
     * callers receive the same externally visible response
     * whether the account exists or not.
     *
     * An email may legitimately exist in multiple tenants.
     * Never select an arbitrary tenant with LIMIT 1.
     * Ambiguous identities receive the same response as
     * nonexistent accounts.
     */
    if (result.rows.length !== 1) {
      await client.query("ROLLBACK");

      return {
        token: null,
        userId: null,
        tenantId: null,
      };
    }

    const user = result.rows[0];
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);

    /*
     * Invalidate previous unused reset tokens for this user.
     * Because the user row is locked inside this transaction,
     * concurrent reset requests for the same account are
     * serialized.
     */
    await client.query(
      `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = $1
          AND used_at IS NULL
      `,
      [user.id],
    );

    await client.query(
      `
        INSERT INTO password_reset_tokens (
          id,
          user_id,
          tenant_id,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          NOW() + ($5 * INTERVAL '1 minute')
        )
      `,
      [
        randomUUID(),
        user.id,
        user.tenant_id,
        tokenHash,
        RESET_TOKEN_TTL_MINUTES,
      ],
    );

    await client.query("COMMIT");

    return {
      token,
      userId: user.id,
      tenantId: user.tenant_id,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{
  success: boolean;
  userId: string | null;
  tenantId: string | null;
}> {
  const tokenHash = hashResetToken(token);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query<{
      id: string;
      user_id: string;
      tenant_id: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `
        SELECT
          id,
          user_id,
          tenant_id,
          expires_at,
          used_at
        FROM password_reset_tokens
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash],
    );

    if (tokenResult.rows.length !== 1) {
      await client.query("ROLLBACK");

      return {
        success: false,
        userId: null,
        tenantId: null,
      };
    }

    const resetToken = tokenResult.rows[0];

    if (
      resetToken.used_at !== null ||
      resetToken.expires_at.getTime() <= Date.now()
    ) {
      await client.query("ROLLBACK");

      return {
        success: false,
        userId: null,
        tenantId: null,
      };
    }

    const userResult = await client.query<{
      id: string;
      tenant_id: string;
      is_active: boolean;
      tenant_status: "active" | "suspended" | "revoked";
    }>(
      `
        SELECT
          u.id,
          u.tenant_id,
          u.is_active,
          t.status AS tenant_status
        FROM users u
        INNER JOIN tenants t
          ON t.id = u.tenant_id
        WHERE u.id = $1
          AND u.tenant_id = $2
        FOR UPDATE
      `,
      [
        resetToken.user_id,
        resetToken.tenant_id,
      ],
    );

    if (
      userResult.rows.length !== 1 ||
      !userResult.rows[0].is_active ||
      userResult.rows[0].tenant_status !== "active"
    ) {
      await client.query("ROLLBACK");

      return {
        success: false,
        userId: null,
        tenantId: null,
      };
    }

    const user = userResult.rows[0];
    const passwordHash = await hashPassword(newPassword);

    await client.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          failed_login_count = 0,
          locked_until = NULL,
          updated_at = NOW()
        WHERE id = $2
          AND tenant_id = $3
      `,
      [
        passwordHash,
        user.id,
        user.tenant_id,
      ],
    );

    /*
     * Password reset invalidates every existing authentication
     * session. The user must authenticate again.
     */
    await client.query(
      `
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE user_id = $1
          AND tenant_id = $2
          AND revoked_at IS NULL
      `,
      [
        user.id,
        user.tenant_id,
      ],
    );

    /*
     * Single-use reset credential.
     */
    const consumed = await client.query(
      `
        UPDATE password_reset_tokens
        SET used_at = NOW()
        WHERE id = $1
          AND used_at IS NULL
        RETURNING id
      `,
      [resetToken.id],
    );

    if (consumed.rows.length !== 1) {
      await client.query("ROLLBACK");

      return {
        success: false,
        userId: null,
        tenantId: null,
      };
    }

    await client.query("COMMIT");

    return {
      success: true,
      userId: user.id,
      tenantId: user.tenant_id,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
