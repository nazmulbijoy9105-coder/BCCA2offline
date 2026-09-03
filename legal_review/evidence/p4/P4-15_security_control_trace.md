# P4-15 — Security Control Trace

## Status
PARTIAL / OPEN

## Confirmed controls

- Login brute-force lockout: PASS — MAX_LOGIN_ATTEMPTS=5; LOCKOUT_MINUTES=15.
- MFA brute-force lockout/replay protection: PASS.
- Session security: PASS — production __Host-bccaa_session, HttpOnly, Secure, SameSite=Strict, bounded TTL, random session token, SHA-256 token hashing, revocation/expiry/tenant validation.
- Trusted-origin enforcement: PASS — enforceTrustedOrigin is mounted on /api in server.ts.

## Open controls

- General API rate limiting: OPEN — no general application-level rate limiter was evidenced.
- Password-reset request throttling: OPEN.
- Password-reset confirmation throttling: OPEN.
- Password-reset dedicated test coverage: OPEN.
- Migration/schema parity: OPEN — migration 006_password_reset.sql contains a partial unique active-token index not present in server/db/schema.sql.
- Dependency vulnerability assessment: OPEN.

## Verified authentication route surface

- POST /password-reset/request
- POST /password-reset/confirm
- POST /login
- POST /mfa/verify
- POST /logout
- GET /me

## Audit conclusion

P4-15 is not a full security PASS.

Authentication lockout, MFA replay/lockout, session hardening, and trusted-origin controls are evidenced.

General API rate limiting and password-reset throttling remain OPEN. Migration/schema parity, dedicated password-reset tests, and current dependency vulnerability status also require closure before an enterprise security PASS.

## Final P4-15 disposition

PARTIAL / OPEN
