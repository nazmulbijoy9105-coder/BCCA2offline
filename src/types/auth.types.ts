export type UserRole = "super_admin" | "admin" | "user";

export type Permission =
  | "admin:dashboard"
  | "case:analyze"
  | "case:export"
  | "case:view_history"
  | "user:manage";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: ["admin:dashboard", "case:analyze", "case:export", "case:view_history", "user:manage"],
  admin: ["admin:dashboard", "case:analyze", "case:export", "case:view_history"],
  user: ["case:analyze", "case:export", "case:view_history"],
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  chamberId: string;
  licenseKey: string;
  createdAt: number;
  lastLogin: number;
  sessionExpiry: number;
  mfaEnabled: boolean;
  isActive: boolean;
  maxCasesPerDay: number;
  casesToday: number;
  lastCaseDate: string;
  passwordHash?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  licenseValid: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
}

export interface LicenseData {
  licenseId: string;
  licenseKey: string;
  issuedTo: string;
  issuedBy: string;
  expiresAt: number;
  maxUsers: number;
  maxAdmins: number;
  tier: "solo" | "chamber" | "enterprise";
  allowedDomains: string[];
  deviceFingerprint?: string;
  features: string[];
}

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "USER_CREATE"
  | "USER_REVOKE"
  | "ANALYZE_START"
  | "ANALYZE_COMPLETE"
  | "ANALYZE_FAILED"
  | "EXPORT_PDF"
  | "LICENSE_VIOLATION";

export interface AuditEvent {
  eventId: string;
  timestamp: number;
  actor: {
    userId: string;
    email: string;
    role: UserRole;
    ip: string;
    deviceFingerprint: string;
  };
  action: AuditAction;
  resource: {
    type: "CASE" | "USER" | "LICENSE" | "SYSTEM" | "AUTH";
    id: string;
  };
  outcome: "SUCCESS" | "FAILURE" | "DENIED";
  metadata: Record<string, any>;
  previousHash: string;
  currentHash: string;
}
