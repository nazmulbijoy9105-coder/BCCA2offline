// Shared test fixtures for BCCAAEngine test files.
// Centralizes AuthUser/AnalyzeRequest construction so the required-field
// shape only needs to be kept in sync with src/types/auth.types.ts and
// src/types/types.ts in one place, instead of five independent copies.

import type { AnalyzeRequest } from "./BCCAAEngine";
import type { AuthUser } from "../types/auth.types";
import type { EngineInput } from "../types/types";

export function makeTestUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "test-id",
    email: "test@test.com",
    name: "Test User",
    role: "user",
    chamberId: "test-chamber",
    licenseKey: "TEST-LICENSE",
    createdAt: 0,
    lastLogin: 0,
    sessionExpiry: 0,
    mfaEnabled: false,
    isActive: true,
    maxCasesPerDay: 100,
    casesToday: 0,
    lastCaseDate: "1970-01-01",
    ...overrides,
  };
}

export function makeAnalyzeRequest(overrides: {
  caseId?: string | null;
  user?: Partial<AuthUser>;
  license?: { licenseId: string; issuedTo: string };
  factPattern?: string;
  submissionDate?: string | null;
  focusDomain?: string;
} = {}): AnalyzeRequest {
  const input: EngineInput = {
    factPattern: overrides.factPattern ?? "The plaintiff relied on an unregistered bainapatra.",
  };
  if (overrides.submissionDate !== undefined) {
    (input as any).submissionDate = overrides.submissionDate;
  }
  if (overrides.focusDomain !== undefined) {
    input.focusDomain = overrides.focusDomain;
  }

  return {
    caseId: overrides.caseId as any,
    user: makeTestUser(overrides.user),
    license: overrides.license ?? { licenseId: "TEST", issuedTo: "TEST" },
    input,
  } as AnalyzeRequest;
}
