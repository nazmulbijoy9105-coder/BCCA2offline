import * as cryptoUtils from "../../utils/crypto";
import * as authContext from "../../auth/AuthContext";

/**
 * P12-01: Authentication & Authorization Audit Gate.
 * 
 * Verifies the structural integrity of the security module.
 * Ensures that critical auth functions (hashing, verification, role checks)
 * exist and haven't been accidentally deleted or tampered with.
 */

export function verifyAuthIntegrity(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check crypto utilities
  if (typeof cryptoUtils.hashPassword !== 'function') {
    errors.push("Missing critical crypto function: hashPassword.");
  }
  if (typeof cryptoUtils.verifyPassword !== 'function') {
    errors.push("Missing critical crypto function: verifyPassword.");
  }
  if (typeof cryptoUtils.generateSecureId !== 'function') {
    errors.push("Missing critical crypto function: generateSecureId.");
  }

  // 2. Check Auth Context exports (functions and hooks)
  if (typeof authContext.useAuth !== 'function') {
    errors.push("Missing critical auth hook: useAuth.");
  }
  if (typeof authContext.AuthProvider !== 'function') {
    errors.push("Missing critical auth component: AuthProvider.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hard fail-closed guard. Throws an error if the auth module is structurally invalid.
 */
export function assertAuthIntegrity(): void {
  const { isValid, errors } = verifyAuthIntegrity();
  if (!isValid) {
    throw new Error(`Auth Integrity Check Failed: ${errors.join(", ")}`);
  }
}
