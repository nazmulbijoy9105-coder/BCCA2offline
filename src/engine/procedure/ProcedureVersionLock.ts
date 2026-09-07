/**
 * P8-13: Procedural Version Locking.
 * 
 * Provides deterministic access to the exact version of the procedural 
 * rules registry the engine is operating on. Prevents silent drift during audits.
 */

// Hardcoded version of the development procedure registry.
// This must be incremented whenever DevelopmentProcedureRegistry.ts is updated.
const PROCEDURE_REGISTRY_VERSION = "1.0";

export function getProcedureRegistryVersion(): string {
  return PROCEDURE_REGISTRY_VERSION;
}

/**
 * Validates that the engine is running against an expected procedure registry version.
 * Fails closed if there is a version mismatch.
 */
export function assertProcedureRegistryVersion(expectedVersion: string): void {
  const actualVersion = getProcedureRegistryVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Procedure Registry Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
