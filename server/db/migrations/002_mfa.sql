-- ============================================================
-- BCCAA P1.8.2C.5 — SERVER MFA
-- PostgreSQL
--
-- Security properties:
--   - TOTP secret is encrypted at rest
--   - sessions explicitly track MFA verification
--   - MFA verification timestamp is retained
--   - pending MFA sessions cannot be treated as fully verified
-- ============================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_secret_ciphertext TEXT;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_last_verified_at TIMESTAMPTZ;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_mfa
    ON users(tenant_id, mfa_enabled, mfa_required);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa
    ON sessions(user_id, mfa_verified, expires_at);

COMMIT;
