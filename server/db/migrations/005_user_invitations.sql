CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invited_by_user_id UUID NOT NULL REFERENCES users(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN ('admin', 'user')),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_invitations_validity
        CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_user_invitations_tenant
    ON user_invitations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email
    ON user_invitations(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_user_invitations_expiry
    ON user_invitations(expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_invitations_pending
    ON user_invitations(tenant_id, email)
    WHERE accepted_at IS NULL
      AND revoked_at IS NULL;
