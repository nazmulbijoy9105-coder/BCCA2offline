import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, AuthState, UserRole, ROLE_PERMISSIONS, Permission } from "../types/auth.types";
import { LicenseData } from "../types/auth.types";
import { validateLicenseKey, getStoredLicense, storeLicense, clearLicense } from "../utils/license";
import { hashPassword, verifyPassword, generateSecureId } from "../utils/crypto";
import { logAudit } from "../utils/audit";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export interface PublicRegisterParams {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  chamberName?: string;
  authMethod: "email" | "phone" | "gmail";
}

interface AuthContextType {
  state: AuthState;
  login: (identifier: string, password: string, licenseKey?: string) => Promise<void>;
  logout: () => void;
  registerUser: (params: PublicRegisterParams) => Promise<void>;
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

        // P0 SECURITY:
        // Do not create default accounts with generated credentials.
        // Do not persist plaintext seed passwords in localStorage.
        // Do not print credentials to the browser console.
        //
        // Account provisioning must occur through an explicit registration/
        // administrative provisioning flow with a user-supplied password.
        const currentUsers = getUsers();

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
                licenseValid: false,
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

  const login = useCallback(async (identifier: string, password: string, licenseKey?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const cleanIdent = identifier.trim();
      const users = getUsers();
      
      // Look up user by email or phone
      const user = users.find(u => {
        if (!u.isActive) return false;
        if (u.email && u.email.toLowerCase() === cleanIdent.toLowerCase()) return true;
        if (u.phone && (u.phone.trim() === cleanIdent || cleanIdent.endsWith(u.phone.trim().replace(/^\+88/, "")))) return true;
        return false;
      });

      if (!user) {
        logAudit({
          action: "LOGIN_FAILED",
          userId: "unknown",
          email: cleanIdent,
          role: "user",
          resourceType: "AUTH",
          resourceId: cleanIdent,
          outcome: "DENIED",
        });
        throw new Error("Invalid credentials.");
      }

      // Step 2: Verify password
      if (!verifyPassword(password, user.passwordHash || "")) {
        logAudit({
          action: "LOGIN_FAILED",
          userId: user.id,
          email: user.email,
          role: user.role,
          resourceType: "AUTH",
          resourceId: user.id,
          outcome: "DENIED",
        });
        throw new Error("Invalid credentials.");
      }

      // Step 3: Handle license key requirement
      // P0 SECURITY:
      // A missing license must fail closed.
      // Never mint a license during authentication.
      const activeLicenseKey = licenseKey?.trim() || "";

      if (!activeLicenseKey) {
        throw new Error("License key required.");
      }

      // Step 4: Validate the license
      const licenseCheck = validateLicenseKey(activeLicenseKey);
      if (!licenseCheck.valid) {
        logAudit({
          action: "LICENSE_VIOLATION",
          userId: user.id,
          email: user.email,
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
        email: user.email,
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

  const registerUser = useCallback(async (params: PublicRegisterParams) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const users = getUsers();
      
      // P0 SECURITY:
      // Public registration must provide a real password.
      // Never hash an absent or undefined password.
      if (typeof params.password !== "string" || params.password.length < 12) {
        throw new Error("Password must be at least 12 characters.");
      }

      // Narrowed after runtime validation so hashing receives a string.
      const password = params.password;

      const cleanEmail = params.email?.trim().toLowerCase() || "";
      const cleanPhone = params.phone?.trim() || "";

      if (cleanEmail && users.some(u => u.email.toLowerCase() === cleanEmail)) {
        throw new Error(`An account with email '${cleanEmail}' is already registered.`);
      }
      if (cleanPhone && users.some(u => u.phone === cleanPhone)) {
        throw new Error(`An account with mobile number '${cleanPhone}' is already registered.`);
      }

      // P0 SECURITY:
      // Public registration can NEVER self-provision privileged roles.
      // Admin/Super Admin accounts must be created only through the
      // authenticated administrative provisioning flow.
      // P0 SECURITY:
      // Public registration is permanently constrained to the
      // least-privileged standard user role.
      const role: UserRole = "user";

      const newUser: AuthUser & { passwordHash?: string } = {
        id: generateSecureId(),
        email: cleanEmail || `${cleanPhone}@bdmobile.neumlex.local`,
        phone: cleanPhone || undefined,
        authMethod: params.authMethod,
        name: params.name,
        role: role,
        chamberId: params.chamberName ? params.chamberName.toLowerCase().replace(/[^a-z0-9]/g, "-") : "chamber-bd",
        licenseKey: "",
        createdAt: Date.now(),
        lastLogin: Date.now(),
        sessionExpiry: Date.now() + 8 * 60 * 60 * 1000,
        mfaEnabled: false,
        isActive: true,
        // Publicly registered accounts are always standard users.
        maxCasesPerDay: 10,
        casesToday: 0,
        lastCaseDate: new Date().toISOString().split("T")[0],
        passwordHash: hashPassword(password),
      };

      // P0 SECURITY:
      // Public registration cannot mint, assign, or activate a license.
      // Licensing must be provisioned through an authenticated administrative
      // workflow and validated during login/session establishment.
      users.push(newUser);
      saveUsers(users);

      // P0 SECURITY:
      // Registration creates an account record only.
      // It MUST NOT create an authenticated session.
      // It MUST NOT manufacture license validity.
      // The user must authenticate through the normal login boundary.
      localStorage.removeItem(CURRENT_USER_KEY);
      clearLicense();

      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        licenseValid: false,
        mfaRequired: false,
        mfaVerified: false,
      }));

      logAudit({
        action: "USER_CREATE",
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        resourceType: "AUTH",
        resourceId: newUser.id,
        outcome: "SUCCESS",
        metadata: { method: params.authMethod, role, authenticated: false }
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Registration failed",
      }));
      throw err;
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
    // P0 SECURITY:
    // Only an authenticated Super Admin may provision accounts.
    // NOTE: In a browser-only/localStorage auth model this remains a
    // client-side authorization boundary and must not be treated as
    // equivalent to server-side authorization.
    if (!state.user || state.user.role !== "super_admin" || !state.user.isActive) {
      throw new Error("Unauthorized: Only an active Super Admin can create users");
    }

    // P0 SECURITY:
    // Super Admin accounts must never be provisioned through this generic
    // user-creation flow. They require a separate controlled bootstrap/
    // recovery mechanism.
    if (params.role === "super_admin") {
      throw new Error("Forbidden: Super Admin accounts cannot be created through user provisioning");
    }

    // P0 SECURITY:
    // Administrative provisioning must never hash an absent or weak password.
    if (typeof params.password !== "string" || params.password.length < 12) {
      throw new Error("Password must be at least 12 characters.");
    }

    const password = params.password;

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
    const passwordHash = hashPassword(password);
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
    const user = state.user;

    if (!user || !user.isActive) {
      return false;
    }

    if (!Number.isFinite(user.sessionExpiry) || Date.now() >= user.sessionExpiry) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[user.role];

    // FAIL CLOSED for malformed or unknown roles.
    if (!Array.isArray(permissions)) {
      return false;
    }

    return permissions.includes(perm);
  }, [state.user]);

  const getCurrentUser = useCallback(() => state.user, [state.user]);
  const getLicenseData = useCallback(() => license, [license]);

  return (
    <AuthContext.Provider value={{
      state,
      login,
      logout,
      registerUser,
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