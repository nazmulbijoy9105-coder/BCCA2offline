// P2: Leveled logger -- silences debug in production
const isDev = import.meta.env?.DEV ?? false;

export const logger = {
  debug: (...args: unknown[]): void => { if (isDev) console.debug("[BCCAA]", ...args); },
  info: (...args: unknown[]): void => { if (isDev) console.info("[BCCAA]", ...args); },
  warn: (...args: unknown[]): void => { console.warn("[BCCAA-WARN]", ...args); },
  error: (...args: unknown[]): void => { console.error("[BCCAA-ERROR]", ...args); },
};
