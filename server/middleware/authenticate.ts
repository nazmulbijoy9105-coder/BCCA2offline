import type { NextFunction, Request, Response } from "express";
import {
  getSessionCookieName,
  resolveSession,
} from "../auth/session";
import { requireAuthenticatedUser } from "../auth/authorization";
import type { AuthenticatedUser } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
      authSession?: {
        id: string;
        userId: string;
        tenantId: string;
        mfaVerified: boolean;
        mfaVerifiedAt: Date | null;
      };
    }
  }
}

/*
 * Full authentication boundary.
 *
 * A password-authenticated but MFA-pending session is NOT an
 * authenticated application session.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawToken = req.cookies?.[getSessionCookieName()];

    const resolved = await resolveSession(rawToken);

    if (!resolved) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    const mfaRequired =
      resolved.user.mfaRequired ||
      resolved.user.mfaEnabled;

    if (mfaRequired && !resolved.session.mfaVerified) {
      return res.status(401).json({
        error: "MFA_REQUIRED",
      });
    }

    req.auth = resolved.user;

    req.authSession = {
      id: resolved.session.id,
      userId: resolved.session.userId,
      tenantId: resolved.session.tenantId,
      mfaVerified: resolved.session.mfaVerified,
      mfaVerifiedAt: resolved.session.mfaVerifiedAt,
    };

    try {
      requireAuthenticatedUser(req);
    } catch (err) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    return next();
  } catch (error) {
    console.error("Authentication resolution failed:", error);

    return res.status(500).json({
      error: "AUTHENTICATION_SERVICE_ERROR",
    });
  }
}

/*
 * MFA ceremony middleware.
 *
 * This permits an authenticated password session to reach only
 * the MFA verification operation. It deliberately does not grant
 * application authorization.
 */
export async function authenticateMfaPending(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawToken = req.cookies?.[getSessionCookieName()];

    const resolved = await resolveSession(rawToken);

    if (!resolved) {
      return res.status(401).json({
        error: "UNAUTHENTICATED",
      });
    }

    const mfaRequired =
      resolved.user.mfaRequired ||
      resolved.user.mfaEnabled;

    if (!mfaRequired) {
      return res.status(400).json({
        error: "MFA_NOT_REQUIRED",
      });
    }

    if (resolved.session.mfaVerified) {
      return res.status(409).json({
        error: "MFA_ALREADY_VERIFIED",
      });
    }

    req.auth = resolved.user;

    req.authSession = {
      id: resolved.session.id,
      userId: resolved.session.userId,
      tenantId: resolved.session.tenantId,
      mfaVerified: false,
      mfaVerifiedAt: null,
    };

    return next();
  } catch (error) {
    console.error("MFA authentication resolution failed:", error);

    return res.status(500).json({
      error: "AUTHENTICATION_SERVICE_ERROR",
    });
  }
}
