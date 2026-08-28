import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, AuthState, UserRole, ROLE_PERMISSIONS, Permission } from "../types/auth.types";
import { LicenseData } from "../types/auth.types";
import { validateLicenseKey, getStoredLicense, storeLicense, clearLicense, generateLicenseKey } from "../utils/license";
import { hashPassword, verifyPassword, generateSecureId } from "../utils/crypto";
import { logAudit } from "../utils/audit";
import { getDeviceFingerprint } from "../utils/deviceFingerprint";

export interface PublicRegisterParams {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
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

        // Ensure default users for all roles exist (Super Admin, Chamber Admin, Standard User)
        let currentUsers = getUsers();
        if (currentUsers.length === 0 || !currentUsers.some(u => u.role === "admin") || !currentUsers.some(u => u.role === "user")) {
          // P0 FIX: Generate cryptographically random seed passwords instead of hardcoding.
          // Passwords are persisted in localStorage so they survive reloads.
          const seedPw = (key: string): string => {
            const stored = localStorage.getItem(`_bccaa_seed_${key}`);
            if (stored) return stored;
            const arr = new Uint8Array(16);
            if (typeof crypto !== "undefined" && crypto.getRandomValues) {
              crypto.getRandomValues(arr);
            } else {
              for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
            }
            const pw = Array.from(arr).map(b => b.toString(36)).join("").slice(0, 12) + "!" + Date.now().toString(36).slice(-4);
            localStorage.setItem(`_bccaa_seed_${key}`, pw);
            return pw;
          };

          const superAdminPw = seedPw("super_admin");
          const adminPw = seedPw("admin");
          const userPw = seedPw("user");

          // eslint-disable-next-line no-console
          console.warn("[BCCAA-SECURITY] Default seed accounts created. ONE-TIME PASSWORDS (check localStorage _bccaa_seed_*):");
          console.warn(`  Super Admin (${"nazmul.islam@neumlex.com"}): ${superAdminPw}`);
          console.warn(`  Chamber Admin (${"advocate@neumlex.com"}): ${adminPw}`);
          console.warn(`  Standard User (${"user@neumlex.com"}): ${userPw}`);

          const defaultSuperAdmin: AuthUser & { passwordHash?: string } = {
            id: "SA-2026-DHAKA",
            email: "nazmul.islam@neumlex.com",
            name: "Md. Nazmul Islam (Super Admin)",
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
            passwordHash: hashPassword(superAdminPw),
          };

          const defaultChamberAdmin: AuthUser & { passwordHash?: string } = {
            id: "ADM-2026-DHAKA",
            email: "advocate@neumlex.com",
            name: "Advocate Rahman (Chamber Lead)",
            role: "admin",
            chamberId: "neum-lex-counsel-dhaka",
            licenseKey: "",
            createdAt: Date.now(),
            lastLogin: 0,
            sessionExpiry: 0,
            mfaEnabled: false,
            isActive: true,
            maxCasesPerDay: 100,
            casesToday: 0,
            lastCaseDate: "",
            passwordHash: hashPassword(adminPw),
          };

          const defaultStandardUser: AuthUser & { passwordHash?: string } = {
            id: "USR-2026-DHAKA",
            email: "user@neumlex.com",
            name: "Junior Associate (User)",
            role: "user",
            chamberId: "neum-lex-counsel-dhaka",
            licenseKey: "",
            createdAt: Date.now(),
            lastLogin: 0,
            sessionExpiry: 0,
            mfaEnabled: false,
            isActive: true,
            maxCasesPerDay: 10,
            casesToday: 0,
            lastCaseDate: "",
            passwordHash: hashPassword(userPw),
          };

          // Combine with existing users without duplicate emails
          const existingMap = new Map(currentUsers.map(u => [u.email, u]));
          if (!existingMap.has(defaultSuperAdmin.email)) existingMap.set(defaultSuperAdmin.email, defaultSuperAdmin);
          if (!existingMap.has(defaultChamberAdmin.email)) existingMap.set(defaultChamberAdmin.email, defaultChamberAdmin);
          if (!existingMap.has(defaultStandardUser.email)) existingMap.set(defaultStandardUser.email, defaultStandardUser);

          currentUsers = Array.from(existingMap.values());
          saveUsers(currentUsers);
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
        throw new Error("Invalid credentials: No registered account found matching email or mobile number.");
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
        throw new Error("Invalid credentials: Password incorrect.");
      }

      // Step 3: Handle license key requirement
      let activeLicenseKey = licenseKey || "";

      if (!activeLicenseKey) {
        // Automatically generate a valid enterprise license if none provided
        const { licenseKey: autoKey } = generateLicenseKey({
          issuedTo: `${user.name} (${user.role.toUpperCase()} License)`,
          issuedBy: "Md. Nazmul Islam (Super Admin)",
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
          maxAdmins: 10,
          maxUsers: 100,
          tier: "enterprise",
          allowedDomains: ["localhost", "127.0.0.1", "run.app", "vercel.app", "vercel.dev", "github.io"],
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
      
      const cleanEmail = params.email?.trim().toLowerCase() || "";
      const cleanPhone = params.phone?.trim() || "";

      if (cleanEmail && users.some(u => u.email.toLowerCase() === cleanEmail)) {
        throw new Error(`An account with email '${cleanEmail}' is already registered.`);
      }
      if (cleanPhone && users.some(u => u.phone === cleanPhone)) {
        throw new Error(`An account with mobile number '${cleanPhone}' is already registered.`);
      }

      const role = params.role || "user";
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
        maxCasesPerDay: role === "super_admin" ? Infinity : (role === "admin" ? 100 : 10),
        casesToday: 0,
        lastCaseDate: new Date().toISOString().split("T")[0],
        passwordHash: hashPassword(params.password ?? ""),
      };

      // Auto generate license
      const { licenseKey: autoKey, licenseData } = generateLicenseKey({
        issuedTo: `${newUser.name} (${role.toUpperCase()})`,
        issuedBy: "Md. Nazmul Islam (Super Admin)",
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        maxAdmins: 10,
        maxUsers: 100,
        tier: "enterprise",
        allowedDomains: ["localhost", "127.0.0.1", "run.app", "vercel.app", "vercel.dev", "github.io"],
        features: ["offline_engine", "pdf_export", "case_history", "audit_logs", "user_management"]
      });

      newUser.licenseKey = autoKey;
      users.push(newUser);
      saveUsers(users);

      storeLicense(autoKey);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      setLicense(licenseData || null);
      setState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        licenseValid: true,
        mfaRequired: false,
        mfaVerified: true,
      });

      logAudit({
        action: "USER_CREATE",
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        resourceType: "AUTH",
        resourceId: newUser.id,
        outcome: "SUCCESS",
        metadata: { method: params.authMethod, role: params.role }
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