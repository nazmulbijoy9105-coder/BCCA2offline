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
  // P0 FIX: Never hardcode production passwords. Read from env or prompt.
  const envPassword = process.env.BCCAA_SEED_PASSWORD;
  const password = envPassword || (() => {
    const arr = new Uint8Array(16);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    const pw = Array.from(arr).map(b => b.toString(36)).join("").slice(0, 12) + "!" + Date.now().toString(36).slice(-4);
    return pw;
  })();

  if (!envPassword) {
    console.warn("[BCCAA-SECURITY] No BCCAA_SEED_PASSWORD env var set. A random password was generated.");
  }

  const setup: SuperAdminSetup = {
    name: "Md. Nazmul Islam",
    email: "nazmul.islam@neumlex.com",
    password,
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
  if (!envPassword) {
    console.log(`\n🔐 ONE-TIME GENERATED PASSWORD: ${password}`);
    console.log("   Set BCCAA_SEED_PASSWORD env var to make this deterministic.");
  }
}

main();
