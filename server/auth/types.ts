export type UserRole = "super_admin" | "admin" | "user";

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mfaRequired: boolean;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  expiresAt: Date;
}
