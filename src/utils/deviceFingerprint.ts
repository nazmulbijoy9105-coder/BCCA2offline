/**
 * Generates a stable device fingerprint in browser environments.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return "DFP-CLI-TERMINAL-ENV";
  }

  let fp = localStorage.getItem("_bccaa_device_fp");
  if (!fp) {
    try {
      const userAgent = navigator.userAgent || "unknown-ua";
      const screenWidth = window.screen?.width || 0;
      const screenHeight = window.screen?.height || 0;
      const language = navigator.language || "en";
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown-tz";
      
      const rawData = `${userAgent}|${screenWidth}x${screenHeight}|${language}|${timezone}`;
      
      let hash = 0;
      for (let i = 0; i < rawData.length; i++) {
        hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
        hash |= 0;
      }
      fp = "DFP-" + Math.abs(hash).toString(16).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
      localStorage.setItem("_bccaa_device_fp", fp);
    } catch {
      fp = "DFP-FALLBACK-SECURE-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }
  return fp;
}
