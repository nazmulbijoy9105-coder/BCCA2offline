/**
 * P11-11: Determinism Version Locking.
 * 
 * Provides deterministic access to the exact version of the determinism 
 * rules and verifiers the engine is operating on. Prevents silent drift during audits.
 */

// Hardcoded version of the development determinism module.
// This must be incremented whenever the determinism checks are updated.
const DETERMINISM_MODULE_VERSION = "1.0";

export function getDeterminismModuleVersion(): string {
  return DETERMINISM_MODULE_VERSION;
}

/**
 * Validates that the engine is running against an expected determinism module version.
 * Fails closed if there is a version mismatch.
 */
export function assertDeterminismModuleVersion(expectedVersion: string): void {
  const actualVersion = getDeterminismModuleVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Determinism Module Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
