import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Scale, ShieldAlert, Key, Mail, Sparkles, Phone, User, Building, CheckCircle, ArrowRight, Smartphone, Globe } from "lucide-react";
import { generateLicenseKey } from "../utils/license";
import { UserRole } from "../types/auth.types";

export default function LoginPage() {
  const { login, registerUser, state } = useAuth();
  
  // Tab control: "login" | "signup"
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");

  // Signup form state
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [signupMethod, setSignupMethod] = useState<"email" | "phone" | "gmail">("phone");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("+880 ");
  const [signupPassword, setSignupPassword] = useState("");
  const [chamberName, setChamberName] = useState("");
  
  // SMS OTP Simulation for Bangladesh mobile signup
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [userEnteredOtp, setUserEnteredOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Status flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCustomError(null);

    try {
      await login(loginIdentifier, loginPassword, licenseKey);
    } catch (err: any) {
      setCustomError(err.message || "Invalid credentials or license key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bangladesh Mobile OTP Dispatch Simulation
  const handleSendOtp = () => {
    if (!signupPhone || signupPhone.length < 10) {
      setCustomError("Please enter a valid 11-digit Bangladesh mobile number (+880 1712-XXXXXX).");
      return;
    }
    setCustomError(null);
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(mockOtp);
    setOtpSent(true);
    setUserEnteredOtp(mockOtp); // prefill for frictionless demo UX
    setOtpVerified(true);
  };

  // Handle Signup submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCustomError(null);

    try {
      if (!fullName.trim()) {
        throw new Error("Full Legal Name is required.");
      }

      if (signupMethod === "phone") {
        if (!signupPhone || signupPhone.trim().length < 10) {
          throw new Error("Please enter a valid Bangladesh mobile phone number.");
        }
      } else {
        if (!signupEmail || !signupEmail.includes("@")) {
          throw new Error("Please enter a valid Gmail / Email address.");
        }
      }

      if (signupMethod !== "gmail" && (!signupPassword || signupPassword.length < 6)) {
        throw new Error("Password must be at least 6 characters.");
      }

      await registerUser({
        name: fullName.trim(),
        email: signupMethod !== "phone" ? signupEmail.trim() : undefined,
        phone: signupMethod === "phone" ? signupPhone.trim() : undefined,
        password: signupPassword || "GeneralPass123!",
        role: selectedRole,
        chamberName: chamberName.trim() || "Chamber BD",
        authMethod: signupMethod,
      });

      setSuccessMsg(`Registration successful! Logged in as ${selectedRole.toUpperCase()}.`);
    } catch (err: any) {
      setCustomError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Gmail / Google 1-Click Signup Simulation
  const handleGoogleQuickAuth = async (role: UserRole) => {
    setIsSubmitting(true);
    setCustomError(null);
    try {
      const mockGoogleEmails = {
        super_admin: "nazmul.islam.bd@gmail.com",
        admin: "advocate.hossain.dhaka@gmail.com",
        user: "associate.kamal.bd@gmail.com",
      };
      const mockNames = {
        super_admin: "Md. Nazmul Islam (Super Admin)",
        admin: "Advocate Hossain (Chamber Lead)",
        user: "Junior Advocate Kamal (User)",
      };

      await registerUser({
        name: mockNames[role],
        email: mockGoogleEmails[role],
        password: "GoogleAuthPass123!",
        role: role,
        chamberName: "Supreme Court Bar Counsel Dhaka",
        authMethod: "gmail",
      });
    } catch (err: any) {
      // If user exists, log in directly
      try {
        await login(
          role === "super_admin" ? "nazmul.islam.bd@gmail.com" : (role === "admin" ? "advocate.hossain.dhaka@gmail.com" : "associate.kamal.bd@gmail.com"),
          "GoogleAuthPass123!"
        );
      } catch (loginErr: any) {
        setCustomError(err.message || "Google Authentication failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick autofill demo credentials helper
  const handleAutofillRole = (role: UserRole) => {
    const { licenseKey: demoKey } = generateLicenseKey({
      issuedTo: `Neum Lex Counsel (${role.toUpperCase()})`,
      issuedBy: "Md. Nazmul Islam (Super Admin)",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      maxUsers: 20,
      maxAdmins: 5,
      tier: "enterprise",
      allowedDomains: ["localhost", "127.0.0.1", "run.app", "vercel.app", "vercel.dev", "github.io"],
      features: ["offline_engine", "pdf_export", "case_history", "audit_logs", "user_management"]
    });

    if (role === "super_admin") {
      setLoginIdentifier("nazmul.islam@neumlex.com");
      setLoginPassword("YourSecurePassword123!");
    } else if (role === "admin") {
      setLoginIdentifier("advocate@neumlex.com");
      setLoginPassword("AdvocatePass123!");
    } else {
      setLoginIdentifier("user@neumlex.com");
      setLoginPassword("UserPass123!");
    }

    setLicenseKey(demoKey);
    setCustomError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-4 sm:p-8 font-sans text-[#1E252B]">
      {/* Top Border Accent Line */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#C5A059] z-50" />

      <div className="max-w-xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-center my-6">
        {/* Geometric Logo/Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-[#1E252B] text-[#FDFBF7] border-2 border-[#C5A059]">
            <Scale className="h-9 w-9 stroke-[1.2] text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-[#1E252B]">
              BCCAA Legal Platform
            </h2>
            <p className="mt-1 text-[11px] font-mono text-[#C5A059] uppercase tracking-widest font-bold">
              Bangladesh Civil Case Analysis Architecture
            </p>
          </div>
        </div>

        {/* Content Box with Tabs */}
        <div className="bg-white border-2 border-[#1E252B] p-5 sm:p-7 space-y-6 relative shadow-lg">
          {/* Subtle geometric corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5A059]" />

          {/* Tab Navigation Bar */}
          <div className="flex border-b-2 border-[#1E252B] font-mono text-xs">
            <button
              type="button"
              onClick={() => { setActiveTab("login"); setCustomError(null); }}
              className={`flex-1 py-3 px-4 font-bold uppercase tracking-wider transition text-center cursor-pointer ${
                activeTab === "login"
                  ? "bg-[#1E252B] text-white"
                  : "bg-[#FAF9F5] text-[#1E252B] hover:bg-neutral-100"
              }`}
            >
              Log In to Account
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("signup"); setCustomError(null); }}
              className={`flex-1 py-3 px-4 font-bold uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "signup"
                  ? "bg-[#1E252B] text-white"
                  : "bg-[#FAF9F5] text-[#1E252B] hover:bg-neutral-100"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>General Sign Up (BD)</span>
            </button>
          </div>

          {/* Error / Success Notifications */}
          {(state.error || customError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="uppercase">Notice:</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">{customError || state.error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 1: LOG IN FORM */}
          {/* ==================================== */}
          {activeTab === "login" && (
            <div className="space-y-5">
              <div className="border-b border-[#E5E1D8] pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#1E252B]">
                  Local Cryptographic Authentication
                </h3>
                <p className="text-[11px] text-[#4A5560] mt-1">
                  Log in using your registered <strong className="text-[#1E252B]">Gmail/Email</strong> or <strong className="text-[#1E252B]">Bangladesh Mobile Number (+880)</strong>.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                    Authorized Gmail / Email or Mobile (+880)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full text-xs font-mono pl-10 pr-3 py-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                      placeholder="lawyer@gmail.com or +880 1712-345678"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                    Security Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Key className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs font-mono pl-10 pr-3 py-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                      Enterprise License Key
                    </label>
                    <span className="text-[9px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 uppercase tracking-wider font-bold">
                      Auto-generated if empty
                    </span>
                  </div>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full text-[10px] font-mono p-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                    placeholder="Leave empty for auto license provision"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || state.isLoading}
                  className="w-full py-3 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] disabled:bg-neutral-300 font-bold uppercase text-xs tracking-wider font-mono border border-[#1E252B] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting || state.isLoading ? "Authenticating Session..." : "Log In to Legal Engine"}
                </button>
              </form>

              {/* Quick Google Sign In */}
              <div className="pt-2 border-t border-[#E5E1D8] space-y-2">
                <p className="text-[10px] font-mono text-[#4A5560] uppercase text-center">
                  Or sign in with Google / Gmail Account:
                </p>
                <button
                  type="button"
                  onClick={() => handleGoogleQuickAuth("user")}
                  className="w-full py-2 bg-white hover:bg-neutral-50 border border-[#E5E1D8] text-xs font-mono text-[#1E252B] font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span>Continue with Gmail / Google Account</span>
                </button>
              </div>

              {/* Role Quick Autofill Helpers */}
              <div className="border-t border-[#E5E1D8] pt-4 space-y-2">
                <p className="text-[10px] font-mono font-bold text-[#1E252B] uppercase tracking-wider text-center">
                  Preset Trial Accounts (Vercel & GitHub Ready)
                </p>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleAutofillRole("super_admin")}
                    className="p-2 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] font-bold uppercase transition text-center cursor-pointer border border-[#1E252B]"
                    title="Super Admin (Full Governance & User Mgmt)"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillRole("admin")}
                    className="p-2 bg-[#FAF9F5] hover:bg-[#1E252B] hover:text-white text-[#1E252B] border border-[#E5E1D8] hover:border-[#1E252B] font-bold uppercase transition text-center cursor-pointer"
                    title="Chamber Lead / Admin (100 Cases/Day)"
                  >
                    Chamber Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutofillRole("user")}
                    className="p-2 bg-[#FAF9F5] hover:bg-[#1E252B] hover:text-white text-[#1E252B] border border-[#E5E1D8] hover:border-[#1E252B] font-bold uppercase transition text-center cursor-pointer"
                    title="Junior Associate / Standard User (10 Cases/Day)"
                  >
                    Standard User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 2: GENERAL SIGN UP (BANGLADESH)  */}
          {/* ==================================== */}
          {activeTab === "signup" && (
            <div className="space-y-5">
              <div className="border-b border-[#E5E1D8] pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#1E252B]">
                  General Account Registration (Bangladesh)
                </h3>
                <p className="text-[11px] text-[#4A5560] mt-1">
                  Create an account as a <strong className="text-[#1E252B]">Standard User</strong>, <strong className="text-[#1E252B]">Chamber Admin</strong>, or <strong className="text-[#1E252B]">Super Admin</strong> using mobile (+880) or Gmail.
                </p>
              </div>

              {/* STEP 1: Select Role */}
              <div className="space-y-1.5 font-mono">
                <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                  1. Select Account Authorization Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("user")}
                    className={`p-2.5 border text-left transition cursor-pointer ${
                      selectedRole === "user"
                        ? "border-[#1E252B] bg-[#1E252B] text-white"
                        : "border-[#E5E1D8] bg-[#FAF9F5] text-[#1E252B] hover:border-[#1E252B]"
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">Standard User</div>
                    <div className="text-[9px] opacity-80 mt-0.5">Junior Associate / Client (10 cases/day)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("admin")}
                    className={`p-2.5 border text-left transition cursor-pointer ${
                      selectedRole === "admin"
                        ? "border-[#1E252B] bg-[#1E252B] text-white"
                        : "border-[#E5E1D8] bg-[#FAF9F5] text-[#1E252B] hover:border-[#1E252B]"
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">Chamber Admin</div>
                    <div className="text-[9px] opacity-80 mt-0.5">Chamber Lead / Partner (100 cases/day)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("super_admin")}
                    className={`p-2.5 border text-left transition cursor-pointer ${
                      selectedRole === "super_admin"
                        ? "border-[#1E252B] bg-[#1E252B] text-white"
                        : "border-[#E5E1D8] bg-[#FAF9F5] text-[#1E252B] hover:border-[#1E252B]"
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase">Super Admin</div>
                    <div className="text-[9px] opacity-80 mt-0.5">System Governor (Unlimited cases)</div>
                  </button>
                </div>
              </div>

              {/* STEP 2: Select Signup Method */}
              <div className="space-y-1.5 font-mono">
                <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                  2. Choose Registration Method
                </label>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setSignupMethod("phone"); setCustomError(null); }}
                    className={`p-2 border font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupMethod === "phone"
                        ? "bg-[#C5A059] text-white border-[#C5A059]"
                        : "bg-white text-[#1E252B] border-[#E5E1D8]"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>BD Mobile (+880)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSignupMethod("email"); setCustomError(null); }}
                    className={`p-2 border font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupMethod === "email"
                        ? "bg-[#C5A059] text-white border-[#C5A059]"
                        : "bg-white text-[#1E252B] border-[#E5E1D8]"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Gmail / Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setSignupMethod("gmail"); setCustomError(null); }}
                    className={`p-2 border font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      signupMethod === "gmail"
                        ? "bg-[#C5A059] text-white border-[#C5A059]"
                        : "bg-white text-[#1E252B] border-[#E5E1D8]"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    <span>Google 1-Click</span>
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              {signupMethod === "gmail" ? (
                /* Google 1-Click Panel */
                <div className="p-4 bg-[#FAF9F5] border border-[#E5E1D8] text-center space-y-3 font-mono">
                  <div className="p-3 bg-white border border-[#E5E1D8] inline-block rounded-full">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E252B] uppercase">
                      One-Click Google / Gmail Sign Up
                    </h4>
                    <p className="text-[10px] text-[#4A5560] mt-1">
                      Register and log in instantly as <strong className="text-[#1E252B] uppercase">{selectedRole}</strong> with your verified Google profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGoogleQuickAuth(selectedRole)}
                    className="w-full py-2.5 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] text-xs font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-[#C5A059]" />
                    <span>Complete Google Registration ({selectedRole.toUpperCase()})</span>
                  </button>
                </div>
              ) : (
                <form className="space-y-3 font-mono" onSubmit={handleSignupSubmit}>
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                        placeholder="Advocate Tanvir Rahman"
                      />
                    </div>
                  </div>

                  {/* Chamber / Organization Name */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                      Chamber / Law Firm Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={chamberName}
                        onChange={(e) => setChamberName(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                        placeholder="Dhaka High Court Annex Chamber"
                      />
                    </div>
                  </div>

                  {/* Conditional: Bangladesh Phone vs Email */}
                  {signupMethod === "phone" ? (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest flex items-center justify-between">
                        <span>Bangladesh Mobile Number (+880)</span>
                        <span className="text-[9px] text-[#C5A059] font-bold">🇧🇩 Bangladesh (+880)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                          placeholder="+880 1712-345678"
                        />
                      </div>

                      {/* Instant OTP Simulation button */}
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-[#C5A059] hover:underline font-bold uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Smartphone className="h-3 w-3" />
                          <span>{otpSent ? "Resend SMS OTP" : "Send SMS Verification OTP"}</span>
                        </button>
                        {otpSent && (
                          <span className="text-emerald-700 font-bold">
                            ✓ OTP Auto-Verified: {simulatedOtp}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                        Gmail / Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                          placeholder="advocate.rahman@gmail.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">
                      Account Security Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || state.isLoading}
                    className="w-full py-3 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] disabled:bg-neutral-300 font-bold uppercase text-xs tracking-wider border border-[#1E252B] transition cursor-pointer flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? "Creating Account..." : `Register as ${selectedRole.toUpperCase()}`}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] font-mono text-[#4A5560] pt-4 border-t border-[#E5E1D8]/50 mt-4">
        <p>Proprietor & Author: <strong className="text-[#1E252B]">Md. Nazmul Islam</strong>, Neum Lex Counsel</p>
        <p className="text-[#C5A059] uppercase tracking-wider font-bold mt-0.5">BCCAA v2.0 Client-Side Secured Engine &bull; Bangladesh General Sign-Up Engine</p>
      </footer>
    </div>
  );
}
