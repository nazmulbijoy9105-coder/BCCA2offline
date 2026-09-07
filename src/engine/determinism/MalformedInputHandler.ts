/**
 * P11-02: Malformed Input Behavior.
 * 
 * Guarantees that the engine fails closed gracefully when fed malformed 
 * input (e.g., invalid dates, null objects). Instead of crashing the API 
 * with an unhandled exception, it routes the error to an INDETERMINATE verdict.
 */

export type FailClosedResult<T> = {
  status: "SUCCESS" | "INDETERMINATE";
  data?: T;
  error?: string;
};

/**
 * Wraps a function in a try/catch block to ensure deterministic fail-closed behavior.
 * If the function throws, it returns an INDETERMINATE status with the error message
 * instead of crashing the process.
 */
export function executeFailClosed<T>(
  fn: () => T,
  errorPrefix: string = "Malformed Input"
): FailClosedResult<T> {
  try {
    const data = fn();
    return {
      status: "SUCCESS",
      data
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "INDETERMINATE",
      error: `${errorPrefix}: ${message}`
    };
  }
}

/**
 * Hard fail-closed guard for validating required fields in an input object.
 * Returns an array of missing fields, or an empty array if valid.
 */
export function findMissingFields<T extends object>(
  input: Partial<T>,
  requiredFields: readonly (keyof T)[]
): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null || input[field] === "") {
      missing.push(String(field));
    }
  }
  
  return missing;
}
