import { DevelopmentOutputRegistry } from "./DevelopmentOutputRegistry";

const registry = new DevelopmentOutputRegistry();

/**
 * P10-12: Output Version Locking.
 * 
 * Provides deterministic access to the exact version of the output 
 * schema registry the engine is operating on. Prevents silent drift during audits.
 */

export function getOutputRegistryVersion(): string {
  return registry.getSchema().version;
}

export function getOutputRegistryId(): string {
  return registry.getSchema().schemaId;
}

/**
 * Validates that the engine is running against an expected output registry version.
 * Fails closed if there is a version mismatch.
 */
export function assertOutputRegistryVersion(expectedVersion: string): void {
  const actualVersion = getOutputRegistryVersion();
  if (actualVersion !== expectedVersion) {
    throw new Error(`Output Registry Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`);
  }
}
