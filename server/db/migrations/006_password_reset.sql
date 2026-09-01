-- ============================================================
-- BCCAA P1.9.1 — PASSWORD RESET TOKENS
-- PostgreSQL
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT password_reset_tokens_expiry_valid
        CHECK (expires_at > created_at),

    CONSTRAINT password_reset_tokens_used_valid
        CHECK (used_at IS NULL OR used_at >= created_at)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
    ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_tenant
    ON password_reset_tokens(tenant_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry
    ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_active
    ON password_reset_tokens(user_id, expires_at)
    WHERE used_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_tokens_active_user
    ON password_reset_tokens(user_id)
    WHERE used_at IS NULL;

COMMIT;
