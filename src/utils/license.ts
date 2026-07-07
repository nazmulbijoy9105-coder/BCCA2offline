import { generateHash } from "./crypto";

const LICENSE_STORAGE_KEY = "_bccaa_license_key";

export interface LicenseData {
  licenseId: string;
  licenseKey: string;
  issuedTo: string;
  issuedBy: string;
  expiresAt: number;
  maxUsers: number;
  maxAdmins: number;
  tier: "solo" | "chamber" | "enterprise";
  allowedDomains: string[];
  deviceFingerprint?: string;
  features: string[];
  signature: string;
}

function encodeBase64(str: string): string {
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(str).toString("base64");
    }
    // Modern Browser UTF-8 safe base64
    const bytes = new TextEncoder().encode(str);
    let binString = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binString += String.fromCharCode(bytes[i]);
    }
    return btoa(binString);
  } catch (e) {
    // Fallback to escape/unescape if anything fails
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return btoa(str);
    }
  }
}

function decodeBase64(b64: string): string {
  // Always clean the base64 string of whitespace, linebreaks, and padding issues
  const cleanB64 = (b64 || "").replace(/\s+/g, "");
  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(cleanB64, "base64").toString("utf-8");
    }
    // Modern Browser UTF-8 safe base64
    const binString = atob(cleanB64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    // Fallback to escape/unescape if anything fails
    try {
      return decodeURIComponent(escape(atob(cleanB64)));
    } catch {
      try {
        return atob(cleanB64);
      } catch (err: any) {
        throw new Error("Base64 decoding failed: " + err.message);
      }
    }
  }
}

/**
 * Generates a signed license key
 */
export function generateLicenseKey(config: {
  issuedTo: string;
  issuedBy: string;
  expiresAt: number;
  maxUsers: number;
  maxAdmins: number;
  tier: "solo" | "chamber" | "enterprise";
  allowedDomains: string[];
  deviceFingerprint?: string;
  features: string[];
}): { licenseKey: string; licenseData: LicenseData } {
  const licenseId = "LIC-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const rawDataForSig = `${licenseId}|${config.issuedTo}|${config.expiresAt}|${config.tier}`;
  const signature = "SIG_" + generateHash(rawDataForSig + "_neum_lex_license_secret_");

  const licenseData: LicenseData = {
    ...config,
    licenseId,
    signature,
    licenseKey: "", // set below
  };

  const licenseKey = encodeBase64(JSON.stringify(licenseData));
  licenseData.licenseKey = licenseKey;

  return { licenseKey, licenseData };
}

/**
 * Validates a license key
 */
export function validateLicenseKey(licenseKey: string): { valid: boolean; reason?: string; data?: LicenseData } {
  try {
    if (!licenseKey || licenseKey.trim() === "") {
      return { valid: false, reason: "License key is empty" };
    }
    const decoded = decodeBase64(licenseKey);
    const data = JSON.parse(decoded);

    // Check required fields
    if (!data.licenseId || !data.issuedTo || !data.expiresAt || !data.signature) {
      return { valid: false, reason: "Corrupted license key structure" };
    }

    // Validate signature
    const rawDataForSig = `${data.licenseId}|${data.issuedTo}|${data.expiresAt}|${data.tier}`;
    const expectedSig = "SIG_" + generateHash(rawDataForSig + "_neum_lex_license_secret_");
    if (data.signature !== expectedSig) {
      return { valid: false, reason: "Cryptographic signature mismatch (Tampering detected)" };
    }

    // Check expiry
    if (Date.now() > data.expiresAt) {
      return { valid: false, reason: `License expired on ${new Date(data.expiresAt).toLocaleDateString()}` };
    }

    // Check domain if browser
    if (typeof window !== "undefined" && window.location) {
      const currentDomain = window.location.hostname;
      if (data.allowedDomains && data.allowedDomains.length > 0) {
        const isAllowed = data.allowedDomains.some((d: string) => 
          d === currentDomain || 
          currentDomain === "localhost" || 
          currentDomain === "127.0.0.1" || 
          currentDomain.endsWith("." + d) ||
          currentDomain.endsWith(".vercel.app") ||
          currentDomain.endsWith(".run.app")
        );
        if (!isAllowed) {
          return { valid: false, reason: `Domain ${currentDomain} is unauthorized under license terms` };
        }
      }
    }

    // Check device fingerprint if locked
    if (typeof window !== "undefined" && data.deviceFingerprint) {
      const currentFp = localStorage.getItem("_bccaa_device_fp");
      if (currentFp && data.deviceFingerprint !== currentFp) {
        return { valid: false, reason: "Hardware/Device fingerprint lock mismatch" };
      }
    }

    return { valid: true, data: { ...data, licenseKey } };
  } catch (err: any) {
    return { valid: false, reason: `Failed to parse license key: ${err.message}` };
  }
}

export function getStoredLicense(): string | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  return localStorage.getItem(LICENSE_STORAGE_KEY);
}

export function storeLicense(licenseKey: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
}

export function clearLicense(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}
