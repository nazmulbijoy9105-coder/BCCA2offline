#!/bin/bash
set -e

echo "=== Fix 2: Wire authorization.ts into authenticate middleware ==="
perl -i -pe 's|(} from "\.\./auth/session";)|$1\nimport { requireAuthenticatedUser } from "../auth/authorization";|' server/middleware/authenticate.ts

perl -i -0777 -pe 's|(req\.authSession = \{\n      id: resolved\.session\.id,\n      userId: resolved\.session\.userId,\n      tenantId: resolved\.session\.tenantId,\n      mfaVerified: resolved\.session\.mfaVerified,\n      mfaVerifiedAt: resolved\.session\.mfaVerifiedAt,\n    \};)|(req.authSession = {\n      id: resolved.session.id,\n      userId: resolved.session.userId,\n      tenantId: resolved.session.tenantId,\n      mfaVerified: resolved.session.mfaVerified,\n      mfaVerifiedAt: resolved.session.mfaVerifiedAt,\n    };\n\n    try {\n      requireAuthenticatedUser(req);\n    } catch (err) {\n      return res.status(401).json({\n        error: "UNAUTHENTICATED",\n      });\n    };|s' server/middleware/authenticate.ts

echo "=== Fix 3: Atomic failed-login update ==="
perl -i -0777 -pe 's|    if \(!validPassword\) \{\n      const nextFailedCount = user\.failed_login_count \+ 1;\n\n      if \(nextFailedCount >= MAX_LOGIN_ATTEMPTS\) \{\n        await db\.query\(\n          `\n            UPDATE users\n            SET\n              failed_login_count = 0,\n              locked_until = NOW\(\) \+ \(\$2 \* INTERVAL .1 minute.\),\n              updated_at = NOW\(\)\n            WHERE id = \$1\n          `,\n          \[user\.id, LOCKOUT_MINUTES\],\n        \);\n      \} else \{\n        await db\.query\(\n          `\n            UPDATE users\n            SET\n              failed_login_count = \$2,\n              updated_at = NOW\(\)\n            WHERE id = \$1\n          `,\n          \[user\.id, nextFailedCount\],\n        \);\n      \}\n\n      await recordSecurityEvent\(\n        "LOGIN",\n        "DENIED",\n        user\.tenant_id,\n        user\.id,\n        req\.requestId,\n        \{ reason: "invalid_password" \},\n      \);\n\n      return res\.status\(401\)\.json\(\{\n        error: "INVALID_CREDENTIALS",\n      \}\);\n    \}|    if (!validPassword) {\n      const lockoutResult = await db.query<{\n        failed_login_count: number;\n        locked_until: Date | null;\n      }>(\n        \\`\n          UPDATE users\n          SET\n            failed_login_count = failed_login_count + 1,\n            locked_until = CASE\n              WHEN failed_login_count + 1 >= \\$2 THEN NOW() + (\\$3 * INTERVAL \\x271 minute\\x27)\n              ELSE locked_until\n            END,\n            updated_at = NOW()\n          WHERE id = \\$1\n          RETURNING failed_login_count, locked_until\n        \\`,\n        [user.id, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES],\n      );\n\n      const isNowLocked =\n        lockoutResult.rows[0].locked_until !== null &&\n        lockoutResult.rows[0].locked_until.getTime() > Date.now();\n\n      await recordSecurityEvent(\n        "LOGIN",\n        "DENIED",\n        user.tenant_id,\n        user.id,\n        req.requestId,\n        {\n          reason: "invalid_password",\n          failedLoginCount: lockoutResult.rows[0].failed_login_count,\n          locked: isNowLocked,\n        },\n      ).catch(() => undefined);\n\n      if (isNowLocked) {\n        return res.status(423).json({\n          error: "ACCOUNT_LOCKED",\n        });\n      }\n\n      return res.status(401).json({\n        error: "INVALID_CREDENTIALS",\n      });\n    }|s' server/routes/auth.ts

echo "=== Fix 4: Fire-and-forget security events ==="
perl -i -pe 's|(await recordSecurityEvent\(\n        "LOGIN",\n        "DENIED",\n        null,\n        null,\n        req\.requestId,\n        \{ reason: "invalid_credentials" \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "LOGIN",\n        "DENIED",\n        user\.tenant_id,\n        user\.id,\n        req\.requestId,\n        \{ reason: "account_locked" \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "LOGIN",\n        "DENIED",\n        user\.tenant_id,\n        user\.id,\n        req\.requestId,\n        \{ reason: "account_or_tenant_inactive" \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n      "LOGIN",\n      mfaRequired \? "MFA_REQUIRED" : "SUCCESS",\n      user\.tenant_id,\n      user\.id,\n      req\.requestId,\n      \{\n        mfaRequired,\n        sessionId: session\.id,\n      \},\n    \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "MFA_VERIFY",\n        "DENIED",\n        user\.tenantId,\n        user\.id,\n        req\.requestId,\n        \{ reason: "mfa_secret_unavailable" \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "MFA_VERIFY",\n        "DENIED",\n        user\.tenantId,\n        user\.id,\n        req\.requestId,\n        \{\n          reason: "mfa_locked",\n        \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "MFA_VERIFY",\n        "DENIED",\n        user\.tenantId,\n        user\.id,\n        req\.requestId,\n        \{\n          reason: "totp_replay",\n        \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "MFA_VERIFY",\n        "DENIED",\n        user\.tenantId,\n        user\.id,\n        req\.requestId,\n        \{\n          reason: "invalid_code",\n        \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n        "MFA_VERIFY",\n        "DENIED",\n        user\.tenantId,\n        user\.id,\n        req\.requestId,\n        \{\n          reason: "session_update_failed",\n        \},\n      \));|$1.catch(() => undefined);|' server/routes/auth.ts

perl -i -pe 's|(await recordSecurityEvent\(\n      "MFA_VERIFY",\n      "SUCCESS",\n      user\.tenantId,\n      user\.id,\n      req\.requestId,\n      \{\n        sessionId: authSession\.id,\n        acceptedCounter,\n      \},\n    \));|$1.catch(() => undefined);|' server/routes/auth.ts

echo "=== Fix 5: Logout security comment ==="
perl -i -pe 's|^(router\.post\("/logout", async \(req, res\) => \{\n  try \{\n    const rawToken =)|/*\n * Logout is intentionally unauthenticated.\n * Whatever valid session cookie is supplied is revoked.\n * This is fail-safe: even a partially-authenticated client\n * can clear its session. The 204 response is identical\n * regardless of whether the cookie was valid.\n */\n$1|' server/routes/auth.ts

echo "=== Fix 6: Cookie name hardening ==="
perl -i -0777 -pe 's|const COOKIE_NAME =\n  process\.env\.SESSION_COOKIE_NAME\?\.trim\(\) \|\|\n  \(process\.env\.NODE_ENV === "production"\n    \? "__Host-bccaa_session"\n    : "bccaa_session"\);|const COOKIE_NAME =\n  process.env.NODE_ENV === "production"\n    ? (() => {\n        const envName = process.env.SESSION_COOKIE_NAME?.trim();\n        if (!envName) return "__Host-bccaa_session";\n        if (\n          envName === "sessionId" ||\n          envName === "connect.sid" ||\n          envName === "sid" ||\n          !envName.startsWith("__Host-")\n        ) {\n          console.warn(\n            \\`SESSION_COOKIE_NAME "${envName}" does not use __Host- prefix. \\` +\n            \\`Forcing __Host-bccaa_session in production.\\`\n          );\n          return "__Host-bccaa_session";\n        }\n        return envName;\n      })()\n    : (process.env.SESSION_COOKIE_NAME?.trim() || "bccaa_session");|s' server/auth/session.ts

echo "=== All fixes applied ==="
