-- ============================================================
-- BCCAA P1 — ENTERPRISE IDENTITY SCHEMA
-- PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN ('super_admin', 'admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret_ciphertext TEXT,
    mfa_enrolled_at TIMESTAMPTZ,
    mfa_last_verified_at TIMESTAMPTZ,
    mfa_last_accepted_counter BIGINT,
    mfa_failed_attempt_count INTEGER NOT NULL DEFAULT 0,
    mfa_locked_until TIMESTAMPTZ,
    failed_login_count INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
    license_key_hash TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    expires_at TIMESTAMPTZ NOT NULL,
    max_users INTEGER NOT NULL,
    max_admins INTEGER NOT NULL,
    max_cases_per_day INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_verified_at TIMESTAMPTZ,
    mfa_failed_attempt_count INTEGER NOT NULL DEFAULT 0,
    mfa_locked_until TIMESTAMPTZ,
    mfa_last_accepted_counter BIGINT
);

CREATE INDEX IF NOT EXISTS idx_users_tenant
    ON users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expiry
    ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_users_mfa
    ON users(tenant_id, mfa_enabled, mfa_required);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa
    ON sessions(user_id, mfa_verified, expires_at);

CREATE INDEX IF NOT EXISTS idx_users_mfa_lock
    ON users(tenant_id, mfa_locked_until);

CREATE INDEX IF NOT EXISTS idx_users_mfa_replay
    ON users(tenant_id, id, mfa_last_accepted_counter);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa_lock
    ON sessions(user_id, mfa_locked_until);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa_replay
    ON sessions(user_id, mfa_last_accepted_counter);

CREATE INDEX IF NOT EXISTS idx_licenses_tenant
    ON licenses(tenant_id);


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

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    actor_user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    request_id TEXT,
    resource_type TEXT,
    resource_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant_time
    ON security_events(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_actor_time
    ON security_events(actor_user_id, created_at);
