import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedUser, UserRole } from "./types";

export class AuthorizationError extends Error {
  readonly code: string;

  constructor(code = "FORBIDDEN") {
    super(code);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export function requireAuthenticatedUser(
  req: Request,
): AuthenticatedUser {
  const user = req.auth;
  const session = req.authSession;

  if (!user || !session) {
    throw new AuthorizationError("AUTHENTICATION_REQUIRED");
  }

  if (user.id !== session.userId) {
    throw new AuthorizationError("AUTHORIZATION_CONTEXT_MISMATCH");
  }

  if (user.tenantId !== session.tenantId) {
    throw new AuthorizationError("AUTHORIZATION_TENANT_MISMATCH");
  }

  if (!user.isActive) {
    throw new AuthorizationError("ACCOUNT_INACTIVE");
  }

  return user;
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = requireAuthenticatedUser(req);

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      return next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        if (error.code === "AUTHENTICATION_REQUIRED") {
          return res.status(401).json({
            error: "AUTHENTICATION_REQUIRED",
          });
        }

        return res.status(403).json({
          error: "FORBIDDEN",
        });
      }

      console.error("Authorization resolution failed:", error);

      return res.status(500).json({
        error: "AUTHORIZATION_SERVICE_ERROR",
      });
    }
  };
}

export function assertSameTenant(
  authenticatedTenantId: string,
  resourceTenantId: string,
): void {
  if (
    !authenticatedTenantId ||
    !resourceTenantId ||
    authenticatedTenantId !== resourceTenantId
  ) {
    throw new AuthorizationError("TENANT_BOUNDARY_VIOLATION");
  }
}

export function assertResourceOwner(
  authenticatedUserId: string,
  resourceOwnerUserId: string,
): void {
  if (
    !authenticatedUserId ||
    !resourceOwnerUserId ||
    authenticatedUserId !== resourceOwnerUserId
  ) {
    throw new AuthorizationError("RESOURCE_OWNER_MISMATCH");
  }
}
