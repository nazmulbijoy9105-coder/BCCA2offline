import { hashPassword, generateSecureId } from "../src/utils/crypto";

const SETUP_KEY = "BCCAA-SETUP-2026-NAZMUL"; // Change this!

interface SuperAdminSetup {
  name: string;
  email: string;
  password: string;
  chamberId: string;
  setupKey: string;
}

function main() {
  const setup: SuperAdminSetup = {
    name: "Md. Nazmul Islam",
    email: "nazmul.islam@neumlex.com",
    password: "YourSecurePassword123!",
    chamberId: "neum-lex-counsel-dhaka",
    setupKey: SETUP_KEY,
  };

  if (setup.setupKey !== SETUP_KEY) {
    console.error("❌ Invalid setup key");
    process.exit(1);
  }

  const user = {
    id: generateSecureId(),
    email: setup.email,
    name: setup.name,
    role: "super_admin",
    chamberId: setup.chamberId,
    licenseKey: "",
    createdAt: Date.now(),
    lastLogin: 0,
    sessionExpiry: 0,
    mfaEnabled: false,
    isActive: true,
    maxCasesPerDay: Infinity,
    casesToday: 0,
    lastCaseDate: "",
    passwordHash: hashPassword(setup.password),
  };

  // Save to localStorage format (for browser) or output JSON
  console.log("═══════════════════════════════════════════════════");
  console.log("  SUPER ADMIN ACCOUNT CREATED");
  console.log("═══════════════════════════════════════════════════\n");
  console.log("Add this to your browser's localStorage as '_bccaa_users':");
  console.log(JSON.stringify([user], null, 2));
  console.log("\n⚠️  Then generate a license key and login!");
}

main();
