import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Permission, UserRole } from "../types/auth.types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  requireMFA?: boolean;
}

function isKnownRole(role: unknown): role is UserRole {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "user"
  );
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  requireMFA = false,
}: ProtectedRouteProps) {
  const { state, hasPermission } = useAuth();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#4A5560]">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  const user = state.user;

  // FAIL CLOSED:
  // No authenticated, active, known-role user may enter.
  if (
    !state.isAuthenticated ||
    !user ||
    !user.isActive ||
    !isKnownRole(user.role) ||
    !Number.isFinite(user.sessionExpiry) ||
    Date.now() >= user.sessionExpiry
  ) {
    return <Navigate to="/login" replace />;
  }

  // MFA is mandatory whenever the authenticated account requires it.
  // Routes no longer need to remember to opt into MFA individually.
  if (state.mfaRequired && !state.mfaVerified) {
    return <Navigate to="/mfa" replace />;
  }

  // Explicit role check.
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Permission check remains fail-closed.
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Preserve the explicit prop for compatibility while making MFA
  // enforcement global above.
  void requireMFA;

  return <>{children}</>;
}
