import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "../db/pool";
import { hashPassword } from "./password";

const INVITATION_TTL_HOURS = 72;

export type InvitationRole = "admin" | "user";

export interface CreatedInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: InvitationRole;
  expiresAt: Date;
  token: string;
}

function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizeInvitationEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

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

export function isInvitationRole(
  value: unknown,
): value is InvitationRole {
  return value === "admin" || value === "user";
}

export async function createInvitation(
  tenantId: string,
  invitedByUserId: string,
  email: string,
  role: InvitationRole,
): Promise<CreatedInvitation> {
  const id = randomUUID();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(token);

  const result = await db.query<{
    id: string;
    tenant_id: string;
    email: string;
    role: InvitationRole;
    expires_at: Date;
  }>(
    `
      INSERT INTO user_invitations (
        id,
        tenant_id,
        invited_by_user_id,
        email,
        role,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW() + ($7 * INTERVAL '1 hour')
      )
      RETURNING
        id,
        tenant_id,
        email,
        role,
        expires_at
    `,
    [
      id,
      tenantId,
      invitedByUserId,
      email,
      role,
      tokenHash,
      INVITATION_TTL_HOURS,
    ],
  );

  const invitation = result.rows[0];

  return {
    id: invitation.id,
    tenantId: invitation.tenant_id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expires_at,
    token,
  };
}

export async function acceptInvitation(
  token: string,
  password: string,
) {
  const tokenHash = hashInvitationToken(token);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const invitationResult = await client.query<{
      id: string;
      tenant_id: string;
      email: string;
      role: InvitationRole;
      expires_at: Date;
      accepted_at: Date | null;
      revoked_at: Date | null;
    }>(
      `
        SELECT
          id,
          tenant_id,
          email,
          role,
          expires_at,
          accepted_at,
          revoked_at
        FROM user_invitations
        WHERE token_hash = $1
        FOR UPDATE
      `,
      [tokenHash],
    );

    if (invitationResult.rows.length !== 1) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "INVALID_INVITATION" };
    }

    const invitation = invitationResult.rows[0];

    if (invitation.accepted_at) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "INVITATION_ALREADY_ACCEPTED" };
    }

    if (invitation.revoked_at) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "INVITATION_REVOKED" };
    }

    if (invitation.expires_at.getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "INVITATION_EXPIRED" };
    }

    const existingUser = await client.query(
      `
        SELECT id
        FROM users
        WHERE tenant_id = $1
          AND email = $2
        LIMIT 1
      `,
      [invitation.tenant_id, invitation.email],
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return { ok: false as const, reason: "USER_ALREADY_EXISTS" };
    }

    const passwordHash = await hashPassword(password);
    const userId = randomUUID();

    await client.query(
      `
        INSERT INTO users (
          id,
          tenant_id,
          email,
          password_hash,
          role,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
      `,
      [
        userId,
        invitation.tenant_id,
        invitation.email,
        passwordHash,
        invitation.role,
      ],
    );

    await client.query(
      `
        UPDATE user_invitations
        SET accepted_at = NOW()
        WHERE id = $1
      `,
      [invitation.id],
    );

    await client.query(
      `
        INSERT INTO security_events (
          id,
          tenant_id,
          actor_user_id,
          action,
          result,
          resource_type,
          resource_id,
          metadata
        )
        VALUES (
          $1,
          $2,
          $3,
          'USER_INVITATION_ACCEPTED',
          'SUCCESS',
          'user_invitation',
          $4,
          $5::jsonb
        )
      `,
      [
        randomUUID(),
        invitation.tenant_id,
        userId,
        invitation.id,
        JSON.stringify({
          email: invitation.email,
          role: invitation.role,
        }),
      ],
    );

    await client.query("COMMIT");

    return {
      ok: true as const,
      userId,
      tenantId: invitation.tenant_id,
      email: invitation.email,
      role: invitation.role,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
