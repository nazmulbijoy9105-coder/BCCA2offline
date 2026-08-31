-- ============================================================
-- BCCAA P1.8.2C.5.7.9
-- CROSS-SESSION MFA REPLAY HARDENING
-- PostgreSQL
--
-- Security property:
--   The last accepted TOTP counter is authoritative at USER
--   scope, preventing reuse of the same TOTP across separate
--   authentication sessions.
-- ============================================================

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_last_accepted_counter BIGINT;

CREATE INDEX IF NOT EXISTS idx_users_mfa_replay
    ON users(tenant_id, id, mfa_last_accepted_counter);

COMMIT;
