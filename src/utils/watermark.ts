import { AuthUser, LicenseData } from "../types/auth.types";
import { generateHash } from "./crypto";

export interface Watermark {
  licenseId: string;
  issuedTo: string;
  userId: string;
  email: string;
  caseId: string;
  timestamp: number;
  forensicHash: string;
  visualString: string;
}

export function generateWatermark(
  user: AuthUser,
  license: LicenseData | { licenseId: string; issuedTo: string },
  caseId: string
): Watermark {
  const timestamp = Date.now();
  const rawData = `${license.licenseId}|${user.id}|${caseId}|${timestamp}`;
  const forensicHash = "WM-" + generateHash(rawData + "_forensic_salt_");
  
  const formattedDate = new Date(timestamp).toLocaleString();
  const visualString = `BCCAA SECURE | LIC: ${license.licenseId} (${license.issuedTo}) | USER: ${user.email} | CASE: ${caseId} | DATE: ${formattedDate} | F-HASH: ${forensicHash}`;

  return {
    licenseId: license.licenseId,
    issuedTo: license.issuedTo,
    userId: user.id,
    email: user.email,
    caseId,
    timestamp,
    forensicHash,
    visualString,
  };
}
