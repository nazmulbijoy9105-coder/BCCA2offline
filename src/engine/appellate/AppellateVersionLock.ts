import { DevelopmentAppellateRegistry } from "./DevelopmentAppellateRegistry";

/**
 * P9-10: Appellate Version Locking.
 * 
 * Provides deterministic access to the exact version of the appellate 
 * development fixture the utility is operating on. This does not establish
 * a production legal corpus version.
 */

// Hardcoded version of the development appellate registry.
// This must be incremented whenever DevelopmentAppellateRegistry.ts is updated.
const APPELLATE_REGISTRY_VERSION = new DevelopmentAppellateRegistry().version;

export function getAppellateRegistryVersion(): string {
  return APPELLATE_REGISTRY_VERSION;
}

/**
 * Validates that the development fixture matches an expected fixture version.
 * Fails closed if there is a version mismatch.
 */
export function assertAppellateRegistryVersion(expectedVersion: string): void {
  const actualVersion = getAppellateRegistryVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Appellate Registry Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
