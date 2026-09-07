/**
 * P9-10: Appellate Version Locking.
 * 
 * Provides deterministic access to the exact version of the appellate 
 * rules registry the engine is operating on. Prevents silent drift during audits.
 */

// Hardcoded version of the development appellate registry.
// This must be incremented whenever DevelopmentAppellateRegistry.ts is updated.
const APPELLATE_REGISTRY_VERSION = "1.0";

export function getAppellateRegistryVersion(): string {
  return APPELLATE_REGISTRY_VERSION;
}

/**
 * Validates that the engine is running against an expected appellate registry version.
 * Fails closed if there is a version mismatch.
 */
export function assertAppellateRegistryVersion(expectedVersion: string): void {
  const actualVersion = getAppellateRegistryVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Appellate Registry Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
