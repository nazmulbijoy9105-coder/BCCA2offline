import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Scale, ShieldAlert, Key, Mail, Sparkles } from "lucide-react";
import { generateLicenseKey } from "../utils/license";

export default function LoginPage() {
  const { login, state } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCustomError(null);

    try {
      await login(email, password, licenseKey);
    } catch (err: any) {
      setCustomError(err.message || "Invalid credentials or license key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutofillDemo = () => {
    // Dynamically generate a valid trial license key at runtime
    const { licenseKey: demoKey } = generateLicenseKey({
      issuedTo: "Neum Lex Counsel (Dhaka)",
      issuedBy: "Md. Nazmul Islam (Super Admin)",
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      maxUsers: 20,
      maxAdmins: 5,
      tier: "enterprise",
      allowedDomains: ["localhost", "127.0.0.1", "run.app", "vercel.app", "vercel.dev"],
      features: ["offline_engine", "pdf_export", "case_history", "audit_logs", "user_management"]
    });

    setEmail("nazmul.islam@neumlex.com");
    setPassword("YourSecurePassword123!");
    setLicenseKey(demoKey);
    setCustomError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-6 sm:p-12 font-sans text-[#1E252B]">
      {/* Top Border Accent Line */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#C5A059]" />

      <div className="max-w-md w-full mx-auto space-y-8 flex-1 flex flex-col justify-center">
        {/* Geometric Logo/Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-[#1E252B] text-[#FDFBF7] border-2 border-[#C5A059] mb-2">
            <Scale className="h-10 w-10 stroke-[1.2] text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-serif text-[#1E252B]">
              BCCAA Platform
            </h2>
            <p className="mt-1.5 text-xs font-mono text-[#C5A059] uppercase tracking-widest font-bold">
              Bangladesh Civil Case Analysis Architecture
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white border-2 border-[#1E252B] p-8 space-y-6 relative">
          {/* Subtle geometric corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5A059]" />

          <div className="border-b border-[#E5E1D8] pb-4">
            <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-[#1E252B]">
              Cryptographic Gate Entry
            </h3>
            <p className="text-[11px] text-[#4A5560] mt-1">
              Provide authorized credentials and a signed AES-Base64 License Key for local decryption.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Error alerts */}
            {(state.error || customError) && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="uppercase">Access Denied:</strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{customError || state.error}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                Authorized Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-mono pl-11 pr-3.5 py-3 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] focus:ring-1 focus:ring-[#1E252B] outline-none text-[#1E252B] transition-all"
                  placeholder="lawyer@neumlex.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono pl-11 pr-3.5 py-3 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] focus:ring-1 focus:ring-[#1E252B] outline-none text-[#1E252B] transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="licenseKey" className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">
                  Cryptographic License Key
                </label>
                <span className="text-[9px] font-mono font-bold text-[#C5A059] bg-[#C5A059]/10 px-1.5 py-0.5 uppercase tracking-wider">
                  Optional for Admins
                </span>
              </div>
              <textarea
                id="licenseKey"
                name="licenseKey"
                rows={3}
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full text-[10px] font-mono p-3 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] focus:ring-1 focus:ring-[#1E252B] outline-none text-[#1E252B] resize-none leading-relaxed transition-all"
                placeholder="Required for standard users. Admins and Super Admins may leave empty for automatic local license generation."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || state.isLoading}
              className="w-full py-3 bg-[#1E252B] hover:bg-[#C5A059] text-[#FDFBF7] hover:text-[#1E252B] disabled:bg-neutral-300 disabled:text-neutral-500 font-bold uppercase text-xs tracking-wider font-mono border border-[#1E252B] hover:border-[#C5A059] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting || state.isLoading ? "Verifying Keys..." : "Initialize Secure Session"}
            </button>
          </form>

          {/* Autofill helper */}
          <div className="border-t border-[#E5E1D8] pt-4">
            <button
              onClick={handleAutofillDemo}
              className="w-full py-2.5 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#1E252B] border border-[#C5A059] font-mono font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#C5A059]" />
              Autofill Trial Credentials
            </button>
            <p className="text-[10px] text-center text-[#4A5560] mt-2 italic font-sans leading-relaxed">
              No physical license? Click to dynamically generate a key and prefill Super Admin access.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] font-mono text-[#4A5560] pt-6 border-t border-[#E5E1D8]/50 mt-8">
        <p>Proprietor & Author: <strong className="text-[#1E252B]">Md. Nazmul Islam</strong>, Neum Lex Counsel</p>
        <p className="text-[#C5A059] uppercase tracking-wider font-bold mt-1">BCCAA v2.0 Client-Side Secured Engine</p>
      </footer>
    </div>
  );
}
