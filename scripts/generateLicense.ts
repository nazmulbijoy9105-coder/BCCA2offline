import { generateLicenseKey } from "../src/utils/license";
import * as fs from "fs";
import * as path from "path";

// Configuration — MODIFY THESE VALUES
const LICENSE_CONFIG = {
  issuedTo: "Neum Lex Counsel",        // Client chamber name
  issuedBy: "Md. Nazmul Islam",         // Your name as Super Admin
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
  maxUsers: 10,                         // Max user accounts
  maxAdmins: 2,                         // Max admin accounts
  tier: "chamber" as const,             // "solo" | "chamber" | "enterprise"
  allowedDomains: ["localhost", "bccaa.neumlex.com", "run.app"], // Allowed domains
  deviceFingerprint: undefined,         // Leave undefined for auto-detect
  features: [
    "offline_engine",
    "pdf_export",
    "print_preview",
    "speech_input",
    "case_history",
    "audit_logs",
    "user_management",
    "advanced_precedents",
  ] as any[],
};

function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  BCCAA SECURE v2.0 — LICENSE KEY GENERATOR");
  console.log("  © 2026 Md. Nazmul Islam, Neum Lex Counsel");
  console.log("═══════════════════════════════════════════════════\n");

  const { licenseKey, licenseData } = generateLicenseKey(LICENSE_CONFIG);

  console.log("✅ LICENSE GENERATED SUCCESSFULLY\n");
  console.log("License Key:");
  console.log("───────────────────────────────────────────────────");
  console.log(licenseKey);
  console.log("───────────────────────────────────────────────────\n");
  console.log("License Details:");
  console.log(`  ID:        ${licenseData.licenseId}`);
  console.log(`  Issued To: ${licenseData.issuedTo}`);
  console.log(`  Issued By: ${licenseData.issuedBy}`);
  console.log(`  Expires:   ${new Date(licenseData.expiresAt).toISOString()}`);
  console.log(`  Max Users: ${licenseData.maxUsers}`);
  console.log(`  Max Admins: ${licenseData.maxAdmins}`);
  console.log(`  Tier:      ${licenseData.tier}`);
  console.log(`  Features:  ${licenseData.features.join(", ")}`);
  console.log(`  Device FP: ${licenseData.deviceFingerprint || "None (Unbound)"}`);

  // Save to file
  const outputDir = path.join(__dirname, "..", "licenses");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const filename = `license_${licenseData.licenseId}_${Date.now()}.key`;
  fs.writeFileSync(path.join(outputDir, filename), licenseKey);
  console.log(`\n💾 Saved to: licenses/${filename}`);

  console.log("\n⚠️  INSTRUCTIONS:");
  console.log("   1. Give this license key to your client");
  console.log("   2. They must enter it on first login");
  console.log("   3. The license is bound to their device fingerprint (if configured)");
  console.log("   4. Keep the .key file as your records");
}

main();
