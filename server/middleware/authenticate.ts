import type { NextFunction, Request, Response } from "express";
import {
  getSessionCookieName,
  resolveSession,
} from "../auth/session";
import type { AuthenticatedUser } from "../auth/types";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

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

    req.auth = resolved.user;
    return next();
  } catch (error) {
    console.error("Authentication resolution failed:", error);

    return res.status(500).json({
      error: "AUTHENTICATION_SERVICE_ERROR",
    });
  }
}
