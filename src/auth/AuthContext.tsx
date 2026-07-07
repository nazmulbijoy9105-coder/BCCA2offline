import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, AuthState, UserRole, ROLE_PERMISSIONS, Permission } from "../types/auth.types";
import { LicenseData } from "../types/auth.types";
import { validateLicenseKey, getStoredLicense, storeLicense, clearLicense, generateLicenseKey } from "../utils/license";
import { hashPassword, verifyPassword, generateSecureId } from "../utils/crypto";
import { logAudit } from "../utils/audit";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string, licenseKey?: string) => Promise<void>;
  logout: () => void;
  createUser: (params: CreateUserParams) => Promise<void>;
  revokeUser: (userId: string) => void;
  hasPermission: (perm: Permission) => boolean;
  getCurrentUser: () => AuthUser | null;
  getLicense: () => LicenseData | null;
}

interface CreateUserParams {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  chamberId: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "_bccaa_users";
const CURRENT_USER_KEY = "_bccaa_current_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    licenseValid: false,
    mfaRequired: false,
    mfaVerified: false,
  });

  const [license, setLicense] = useState<LicenseData | null>(null);

  // Initialize: check for existing session
  useEffect(() => {
    const init = () => {
      try {
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        const storedLicense = getStoredLicense();

        // Ensure we always have at least a default super_admin registered for first-time use
        const currentUsers = getUsers();
        if (currentUsers.length === 0) {
          // Register default super admin
          const defaultAdmin: AuthUser & { passwordHash?: string } = {
            id: "SA-2026-DHAKA",
            email: "nazmul.islam@neumlex.com",
            name: "Md. Nazmul Islam",
            role: "super_admin",
            chamberId: "neum-lex-counsel-dhaka",
            licenseKey: "",
            createdAt: Date.now(),
            lastLogin: 0,
            sessionExpiry: 0,
            mfaEnabled: false,
            isActive: true,
            maxCasesPerDay: Infinity,
            casesToday: 0,
            lastCaseDate: "",
            passwordHash: hashPassword("YourSecurePassword123!"),
          };
          saveUsers([defaultAdmin]);
        }

        if (storedUser && storedLicense) {
          const user: AuthUser = JSON.parse(storedUser);
          const licenseCheck = validateLicenseKey(storedLicense);

          if (licenseCheck.valid && licenseCheck.data) {
            // Check session expiry
            if (Date.now() < user.sessionExpiry) {
              setLicense(licenseCheck.data);
              setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                licenseValid: true,
                mfaRequired: user.mfaEnabled,
                mfaVerified: !user.mfaEnabled,
              });
              return;
            }
          }
        }

        // No valid session
        setState(prev => ({ ...prev, isLoading: false }));
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string, licenseKey?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Verify user exists and check role
      const users = getUsers();
      const user = users.find(u => u.email === email && u.isActive);
      if (!user) {
        logAudit({
          action: "LOGIN_FAILED",
          userId: "unknown",
          email,
          role: "user",
          resourceType: "AUTH",
          resourceId: email,
          outcome: "DENIED",
        });
        throw new Error("Invalid credentials");
      }

      // Step 2: Verify password
      if (!verifyPassword(password, user.passwordHash || "")) {
        logAudit({
          action: "LOGIN_FAILED",
          userId: user.id,
          email,
          role: user.role,
          resourceType: "AUTH",
          resourceId: user.id,
          outcome: "DENIED",
        });
        throw new Error("Invalid credentials");
      }

      // Step 3: Handle license key requirement
      let activeLicenseKey = licenseKey || "";
      const isAdminOrSuper = user.role === "admin" || user.role === "super_admin";

      if (!activeLicenseKey && isAdminOrSuper) {
        // Automatically generate a valid license for admin/super_admin if none provided
        const { licenseKey: autoKey } = generateLicenseKey({
          issuedTo: `${user.name} (Auto Admin License)`,
          issuedBy: "Md. Nazmul Islam (Super Admin)",
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
          maxAdmins: 10,
          maxUsers: 100,
          tier: "enterprise",
          allowedDomains: ["localhost", "127.0.0.1", "run.app"],
          features: ["offline_engine", "pdf_export", "case_history", "audit_logs", "user_management"]
        });
        activeLicenseKey = autoKey;
      }

      // Step 4: Validate the license
      const licenseCheck = validateLicenseKey(activeLicenseKey);
      if (!licenseCheck.valid) {
        logAudit({
          action: "LICENSE_VIOLATION",
          userId: user.id,
          email,
          role: user.role,
          resourceType: "LICENSE",
          resourceId: activeLicenseKey,
          outcome: "DENIED",
          metadata: { reason: licenseCheck.reason },
        });
        throw new Error(`License invalid: ${licenseCheck.reason}`);
      }

      // Step 5: Check daily limit reset
      const today = new Date().toISOString().split("T")[0];
      if (user.lastCaseDate !== today) {
        user.casesToday = 0;
        user.lastCaseDate = today;
      }

      // Step 6: Update session
      const sessionExpiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
      user.lastLogin = Date.now();
      user.sessionExpiry = sessionExpiry;

      // Step 7: Save session
      storeLicense(activeLicenseKey);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      updateUser(user);

      setLicense(licenseCheck.data || null);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        licenseValid: true,
        mfaRequired: user.mfaEnabled,
        mfaVerified: !user.mfaEnabled,
      });

      logAudit({
        action: "LOGIN",
        userId: user.id,
        email,
        role: user.role,
        resourceType: "AUTH",
        resourceId: user.id,
        outcome: "SUCCESS",
      });

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Login failed",
      }));
    }
  }, []);

  const logout = useCallback(() => {
    if (state.user) {
      logAudit({
        action: "LOGOUT",
        userId: state.user.id,
        email: state.user.email,
        role: state.user.role,
        resourceType: "AUTH",
        resourceId: state.user.id,
        outcome: "SUCCESS",
      });
    }

    localStorage.removeItem(CURRENT_USER_KEY);
    clearLicense();
    setLicense(null);
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      licenseValid: false,
      mfaRequired: false,
      mfaVerified: false,
    });
  }, [state.user]);

  const createUser = useCallback(async (params: CreateUserParams) => {
    if (!state.user || state.user.role !== "super_admin") {
      throw new Error("Unauthorized: Only Super Admin can create users");
    }

    const users = getUsers();
    
    // Check license limits
    const currentAdmins = users.filter(u => u.role === "admin" && u.isActive).length;
    const currentUsers = users.filter(u => u.role === "user" && u.isActive).length;

    if (params.role === "admin" && license && currentAdmins >= license.maxAdmins) {
      throw new Error(`License limit: Maximum ${license.maxAdmins} admins allowed`);
    }
    if (params.role === "user" && license && currentUsers >= license.maxUsers) {
      throw new Error(`License limit: Maximum ${license.maxUsers} users allowed`);
    }

    const newUser: AuthUser = {
      id: generateSecureId(),
      email: params.email,
      name: params.name,
      role: params.role,
      chamberId: params.chamberId,
      licenseKey: license?.licenseKey || "",
      createdAt: Date.now(),
      lastLogin: 0,
      sessionExpiry: 0,
      mfaEnabled: false,
      isActive: true,
      maxCasesPerDay: params.role === "admin" ? 100 : 10,
      casesToday: 0,
      lastCaseDate: "",
    };

    // Store password hash separately (not in AuthUser)
    const passwordHash = hashPassword(params.password);
    const userWithPassword = { ...newUser, passwordHash };

    users.push(userWithPassword);
    saveUsers(users);

    logAudit({
      action: "USER_CREATE",
      userId: state.user.id,
      email: state.user.email,
      role: "super_admin",
      resourceType: "USER",
      resourceId: newUser.id,
      outcome: "SUCCESS",
      metadata: { createdRole: params.role, createdEmail: params.email },
    });
  }, [state.user, license]);

  const revokeUser = useCallback((userId: string) => {
    if (!state.user || state.user.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const users = getUsers();
    const target = users.find(u => u.id === userId);
    if (target) {
      target.isActive = false;
      saveUsers(users);

      logAudit({
        action: "USER_REVOKE",
        userId: state.user.id,
        email: state.user.email,
        role: "super_admin",
        resourceType: "USER",
        resourceId: userId,
        outcome: "SUCCESS",
      });
    }
  }, [state.user]);

  const hasPermission = useCallback((perm: Permission): boolean => {
    if (!state.user) return false;
    return ROLE_PERMISSIONS[state.user.role].includes(perm);
  }, [state.user]);

  const getCurrentUser = useCallback(() => state.user, [state.user]);
  const getLicenseData = useCallback(() => license, [license]);

  return (
    <AuthContext.Provider value={{
      state,
      login,
      logout,
      createUser,
      revokeUser,
      hasPermission,
      getCurrentUser,
      getLicense: getLicenseData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper functions
function getUsers(): Array<AuthUser & { passwordHash?: string }> {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: Array<AuthUser & { passwordHash?: string }>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function updateUser(user: AuthUser): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
    saveUsers(users);
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
