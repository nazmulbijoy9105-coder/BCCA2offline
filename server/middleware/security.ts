import type { NextFunction, Request, Response } from "express";

function configuredOrigin(): string | null {
  const origin = process.env.APP_ORIGIN?.trim();
  return origin ? origin.replace(/\/+$/, "") : null;
}

export function enforceTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const method = req.method.toUpperCase();

  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  const expected = configuredOrigin();

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({
        error: "SERVER_ORIGIN_NOT_CONFIGURED",
      });
    }

    return next();
  }

  const origin = req.get("origin");

  if (origin !== expected) {
    return res.status(403).json({
      error: "ORIGIN_NOT_ALLOWED",
    });
  }

  return next();
}
