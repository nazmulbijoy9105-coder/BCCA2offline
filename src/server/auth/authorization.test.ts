import { describe, expect, it } from "vitest";
import type { Request } from "express";
import {
  assertResourceOwner,
  assertSameTenant,
  requireAuthenticatedUser,
  requireRole,
} from "../../../server/auth/authorization";

function makeRequest(
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: "super_admin" | "admin" | "user";
    isActive: boolean;
    mfaRequired: boolean;
    mfaEnabled: boolean;
  },
  session?: {
    userId: string;
    tenantId: string;
  },
): Request {
  return {
    auth: user,
    authSession: session
      ? {
          id: "session-1",
          userId: session.userId,
          tenantId: session.tenantId,
          mfaVerified: true,
          mfaVerifiedAt: new Date(),
        }
      : undefined,
  } as unknown as Request;
}

function makeUser(
  role: "super_admin" | "admin" | "user" = "user",
) {
  return {
    id: "user-a",
    tenantId: "tenant-a",
    email: "user@example.test",
    role,
    isActive: true,
    mfaRequired: false,
    mfaEnabled: false,
  };
}

describe("P1.8.3 authorization boundary", () => {
  describe("authenticated principal", () => {
    it("accepts matching user/session identity", () => {
      const user = makeUser();

      expect(
        requireAuthenticatedUser(
          makeRequest(user, {
            userId: user.id,
            tenantId: user.tenantId,
          }),
        ),
      ).toEqual(user);
    });

    it("fails closed without authentication context", () => {
      expect(() =>
        requireAuthenticatedUser(makeRequest()),
      ).toThrow("AUTHENTICATION_REQUIRED");
    });

    it("rejects user/session user-id mismatch", () => {
      const user = makeUser();

      expect(() =>
        requireAuthenticatedUser(
          makeRequest(user, {
            userId: "different-user",
            tenantId: user.tenantId,
          }),
        ),
      ).toThrow("AUTHORIZATION_CONTEXT_MISMATCH");
    });

    it("rejects user/session tenant mismatch", () => {
      const user = makeUser();

      expect(() =>
        requireAuthenticatedUser(
          makeRequest(user, {
            userId: user.id,
            tenantId: "tenant-b",
          }),
        ),
      ).toThrow("AUTHORIZATION_TENANT_MISMATCH");
    });

    it("rejects inactive accounts", () => {
      const user = {
        ...makeUser(),
        isActive: false,
      };

      expect(() =>
        requireAuthenticatedUser(
          makeRequest(user, {
            userId: user.id,
            tenantId: user.tenantId,
          }),
        ),
      ).toThrow("ACCOUNT_INACTIVE");
    });
  });

  describe("role authorization", () => {
    it("allows explicitly permitted role", () => {
      const user = makeUser("admin");

      const req = makeRequest(user, {
        userId: user.id,
        tenantId: user.tenantId,
      });

      let nextCalled = false;

      const res = {
        status: () => ({
          json: () => undefined,
        }),
      } as never;

      requireRole("admin")(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it("denies unauthorized role with 403", () => {
      const user = makeUser("user");

      const req = makeRequest(user, {
        userId: user.id,
        tenantId: user.tenantId,
      });

      let statusCode: number | undefined;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: () => undefined,
          };
        },
      } as never;

      let nextCalled = false;

      requireRole("admin")(req, res, () => {
        nextCalled = true;
      });

      expect(statusCode).toBe(403);
      expect(nextCalled).toBe(false);
    });

    it("returns 401 without authentication context", () => {
      const req = makeRequest();

      let statusCode: number | undefined;

      const res = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: () => undefined,
          };
        },
      } as never;

      requireRole("admin")(req, res, () => undefined);

      expect(statusCode).toBe(401);
    });
  });

  describe("tenant isolation", () => {
    it("allows same tenant", () => {
      expect(() =>
        assertSameTenant("tenant-a", "tenant-a"),
      ).not.toThrow();
    });

    it("rejects cross-tenant resource", () => {
      expect(() =>
        assertSameTenant("tenant-a", "tenant-b"),
      ).toThrow("TENANT_BOUNDARY_VIOLATION");
    });

    it("fails closed on missing authenticated tenant", () => {
      expect(() =>
        assertSameTenant("", "tenant-a"),
      ).toThrow("TENANT_BOUNDARY_VIOLATION");
    });

    it("fails closed on missing resource tenant", () => {
      expect(() =>
        assertSameTenant("tenant-a", ""),
      ).toThrow("TENANT_BOUNDARY_VIOLATION");
    });
  });

  describe("resource ownership", () => {
    it("allows resource owner", () => {
      expect(() =>
        assertResourceOwner("user-a", "user-a"),
      ).not.toThrow();
    });

    it("rejects another user", () => {
      expect(() =>
        assertResourceOwner("user-a", "user-b"),
      ).toThrow("RESOURCE_OWNER_MISMATCH");
    });

    it("fails closed on missing authenticated user", () => {
      expect(() =>
        assertResourceOwner("", "user-a"),
      ).toThrow("RESOURCE_OWNER_MISMATCH");
    });

    it("fails closed on missing resource owner", () => {
      expect(() =>
        assertResourceOwner("user-a", ""),
      ).toThrow("RESOURCE_OWNER_MISMATCH");
    });
  });
});

// ============================================================
// P1.8.4 — Expanded authorization invariant tests
// ============================================================

import { describe, it, expect } from "vitest";
import type { Request } from "express";
import {
  requireAuthenticatedUser,
  requireRole,
  assertSameTenant,
  assertResourceOwner,
  AuthorizationError,
} from "../../../server/auth/authorization";
import type { AuthenticatedUser } from "../../../server/auth/types";

function mockReq(partial: Partial<Request> = {}): Request {
  return {
    auth: undefined,
    authSession: undefined,
    ...partial,
  } as unknown as Request;
}

const baseUser: AuthenticatedUser = {
  id: "user-1",
  tenantId: "tenant-1",
  email: "test@example.com",
  role: "user",
  isActive: true,
  mfaRequired: false,
  mfaEnabled: false,
};

const baseSession = {
  id: "session-1",
  userId: "user-1",
  tenantId: "tenant-1",
  mfaVerified: true,
  mfaVerifiedAt: null as Date | null,
};

describe("P1.8.4: session authorization invariants", () => {
  it("rejects unauthenticated (no user, no session)", () => {
    const req = mockReq();
    expect(() => requireAuthenticatedUser(req)).toThrow(
      AuthorizationError,
    );
  });

  it("rejects when session.userId !== user.id", () => {
    const req = mockReq({
      auth: baseUser,
      authSession: { ...baseSession, userId: "user-2" },
    });
    expect(() => requireAuthenticatedUser(req)).toThrow(
      AuthorizationError,
    );
  });

  it("rejects when session.tenantId !== user.tenantId", () => {
    const req = mockReq({
      auth: baseUser,
      authSession: { ...baseSession, tenantId: "tenant-2" },
    });
    expect(() => requireAuthenticatedUser(req)).toThrow(
      AuthorizationError,
    );
  });

  it("rejects inactive user", () => {
    const req = mockReq({
      auth: { ...baseUser, isActive: false },
      authSession: baseSession,
    });
    expect(() => requireAuthenticatedUser(req)).toThrow(
      AuthorizationError,
    );
  });

  it("allows active user with matching session", () => {
    const req = mockReq({
      auth: baseUser,
      authSession: baseSession,
    });
    expect(requireAuthenticatedUser(req)).toEqual(baseUser);
  });
});

describe("P1.8.4: role enforcement", () => {
  it("returns 403 for unauthorized role", () => {
    const req = mockReq({
      auth: { ...baseUser, role: "user" as const },
      authSession: baseSession,
    });
    const res: any = { status: (code: number) => ({ json: (body: any) => ({ code, body }) }) };
    const next = () => ({ code: 200 });

    const middleware = requireRole("super_admin");
    const result = middleware(req, res, next) as any;
    expect(result.code).toBe(403);
  });

  it("allows authorized role", () => {
    const req = mockReq({
      auth: { ...baseUser, role: "admin" as const },
      authSession: baseSession,
    });
    let called = false;
    const next = () => { called = true; };
    const middleware = requireRole("admin", "super_admin");
    middleware(req, {} as any, next);
    expect(called).toBe(true);
  });
});

describe("P1.8.4: tenant and resource boundaries", () => {
  it("allows same-tenant resource", () => {
    expect(() =>
      assertSameTenant("tenant-1", "tenant-1"),
    ).not.toThrow();
  });

  it("denies cross-tenant resource", () => {
    expect(() =>
      assertSameTenant("tenant-1", "tenant-2"),
    ).toThrow(AuthorizationError);
  });

  it("denies wrong resource owner", () => {
    expect(() =>
      assertResourceOwner("user-1", "user-2"),
    ).toThrow(AuthorizationError);
  });

  it("allows correct resource owner", () => {
    expect(() =>
      assertResourceOwner("user-1", "user-1"),
    ).not.toThrow();
  });
});
