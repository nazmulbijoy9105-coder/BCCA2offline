-- ============================================================
-- BCCAA P1.8.2C.5.7.1 — MFA ATTEMPT / REPLAY HARDENING
-- PostgreSQL
--
-- Security properties:
--   - MFA failures are tracked independently from password login
--   - MFA lockout is persisted server-side
--   - MFA state is scoped to both user and session
--   - Last accepted TOTP counter is persisted for replay defense
--   - State can be enforced atomically by PostgreSQL
-- ============================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_failed_attempt_count INTEGER
        NOT NULL DEFAULT 0;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMPTZ;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_failed_attempt_count INTEGER
        NOT NULL DEFAULT 0;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_locked_until TIMESTAMPTZ;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS mfa_last_accepted_counter BIGINT;

ALTER TABLE users
    ADD CONSTRAINT users_mfa_failed_attempt_count_nonnegative
    CHECK (mfa_failed_attempt_count >= 0);

ALTER TABLE sessions
    ADD CONSTRAINT sessions_mfa_failed_attempt_count_nonnegative
    CHECK (mfa_failed_attempt_count >= 0);

CREATE INDEX IF NOT EXISTS idx_users_mfa_lock
    ON users(tenant_id, mfa_locked_until);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa_lock
    ON sessions(user_id, mfa_locked_until);

CREATE INDEX IF NOT EXISTS idx_sessions_mfa_replay
    ON sessions(user_id, mfa_last_accepted_counter);

COMMIT;
