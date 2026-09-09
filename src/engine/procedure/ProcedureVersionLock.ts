/**
 * P8-13: Procedural Version Locking.
 *
 * Locks the version exposed by the development procedure fixture.
 * Version identity does not establish legal authority.
 */

import { DevelopmentProcedureRegistry } from "./DevelopmentProcedureRegistry";

const PROCEDURE_REGISTRY_VERSION =
  new DevelopmentProcedureRegistry().registryVersion;

export function getProcedureRegistryVersion(): string {
  return PROCEDURE_REGISTRY_VERSION;
}

export function assertProcedureRegistryVersion(
  expectedVersion: string,
): void {
  const actualVersion = getProcedureRegistryVersion();

  if (actualVersion !== expectedVersion) {
    throw new Error(
      `Procedure Registry Version Mismatch: Expected ${expectedVersion}, but engine is using ${actualVersion}`,
    );
  }
}
