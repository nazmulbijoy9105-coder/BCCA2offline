-- BCCAA P1.8.2C
-- Add tenant binding to existing sessions.
--
-- This migration is intentionally explicit because
-- CREATE TABLE IF NOT EXISTS does not alter an existing table.

BEGIN;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE sessions s
SET tenant_id = u.tenant_id
FROM users u
WHERE u.id = s.user_id
  AND s.tenant_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sessions
        WHERE tenant_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'SESSION_TENANT_BACKFILL_FAILED: sessions still contain NULL tenant_id';
    END IF;
END
$$;

ALTER TABLE sessions
    ALTER COLUMN tenant_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sessions_tenant_id_fkey'
    ) THEN
        ALTER TABLE sessions
            ADD CONSTRAINT sessions_tenant_id_fkey
            FOREIGN KEY (tenant_id)
            REFERENCES tenants(id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sessions_tenant
    ON sessions(tenant_id);

COMMIT;
