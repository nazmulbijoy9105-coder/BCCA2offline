import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { Scale, ShieldAlert, Key, Mail, Sparkles, Phone, User, Building, CheckCircle, Smartphone } from "lucide-react";

export default function LoginPage() {
  const { login, registerUser, state } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("phone");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("+880 ");
  const [signupPassword, setSignupPassword] = useState("");
  const [chamberName, setChamberName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCustomError(null);
    try {
      if (!fullName.trim()) throw new Error("Full Legal Name is required.");
      if (signupMethod === "phone") {
        if (!signupPhone || signupPhone.trim().length < 10) throw new Error("Please enter a valid Bangladesh mobile phone number.");
      } else {
        if (!signupEmail || !signupEmail.includes("@")) throw new Error("Please enter a valid Gmail / Email address.");
      }
      if ((!signupPassword || signupPassword.length < 12)) {
        throw new Error("Password must be at least 12 characters.");
      }
      await registerUser({
        name: fullName.trim(),
        email: signupMethod === "email" ? signupEmail.trim() : undefined,
        phone: signupMethod === "phone" ? signupPhone.trim() : undefined,
        password: signupPassword,
        chamberName: chamberName.trim() || "Chamber BD",
        authMethod: signupMethod,
      });
      setSuccessMsg(`Registration successful. Please sign in.`);
    } catch (err: any) {
      setCustomError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between p-4 sm:p-8 font-sans text-[#1E252B]">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#C5A059] z-50" />
      <div className="max-w-xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-center my-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-[#1E252B] text-[#FDFBF7] border-2 border-[#C5A059]">
            <Scale className="h-9 w-9 stroke-[1.2] text-[#C5A059]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-[#1E252B]">BCCAA Legal Platform</h2>
            <p className="mt-1 text-[11px] font-mono text-[#C5A059] uppercase tracking-widest font-bold">Bangladesh Civil Case Analysis Architecture</p>
          </div>
        </div>
        <div className="bg-white border-2 border-[#1E252B] p-5 sm:p-7 space-y-6 relative shadow-lg">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5A059]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5A059]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5A059]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5A059]" />
          <div className="flex border-b-2 border-[#1E252B] font-mono text-xs">
            <button type="button" onClick={() => { setActiveTab("login"); setCustomError(null); }}
              className={`flex-1 py-3 px-4 font-bold uppercase tracking-wider transition text-center cursor-pointer ${activeTab === "login" ? "bg-[#1E252B] text-white" : "bg-[#FAF9F5] text-[#1E252B] hover:bg-neutral-100"}`}>Log In to Account</button>
            <button type="button" onClick={() => { setActiveTab("signup"); setCustomError(null); }}
              className={`flex-1 py-3 px-4 font-bold uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === "signup" ? "bg-[#1E252B] text-white" : "bg-[#FAF9F5] text-[#1E252B] hover:bg-neutral-100"}`}>
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" /><span>Create Standard Account</span>
            </button>
          </div>
          {(state.error || customError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 text-red-600 flex-shrink-0 mt-0.5" />
              <div><strong className="uppercase">Notice:</strong><p className="mt-0.5 text-[11px] leading-relaxed">{customError || state.error}</p></div>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-mono flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" /><span>{successMsg}</span>
            </div>
          )}
          {activeTab === "login" && (
            <div className="space-y-5">
              <div className="border-b border-[#E5E1D8] pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#1E252B]">Local Cryptographic Authentication</h3>
                <p className="text-[11px] text-[#4A5560] mt-1">Log in using your registered <strong className="text-[#1E252B]">Gmail/Email</strong> or <strong className="text-[#1E252B]">Bangladesh Mobile Number (+880)</strong>.</p>
              </div>
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">Authorized Gmail / Email or Mobile (+880)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Mail className="h-4 w-4" /></div>
                    <input type="text" required value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full text-xs font-mono pl-10 pr-3 py-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="lawyer@gmail.com or +880 1712-345678" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-[#1E252B] uppercase tracking-widest">Security Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Key className="h-4 w-4" /></div>
                    <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs font-mono pl-10 pr-3 py-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="••••••••••••" />
                  </div>
                </div>
                <div className="space-y-1">

                  <input type="text" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)}
                    className="w-full text-[10px] font-mono p-2.5 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" />
                </div>
                <button type="submit" disabled={isSubmitting || state.isLoading}
                  className="w-full py-3 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] disabled:bg-neutral-300 font-bold uppercase text-xs tracking-wider font-mono border border-[#1E252B] transition cursor-pointer flex items-center justify-center gap-2">
                  {isSubmitting || state.isLoading ? "Authenticating Session..." : "Log In to Legal Engine"}
                </button>
              </form>
            </div>
          )}
          {activeTab === "signup" && (
            <div className="space-y-5">
              <div className="border-b border-[#E5E1D8] pb-3">
                <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#1E252B]">General Account Registration (Bangladesh)</h3>
                <p className="text-[11px] text-[#4A5560] mt-1">Create a standard user account using your Bangladesh mobile number (+880) or Gmail / Email. Administrative accounts are provisioned separately by authorized administrators.</p>
              </div>
              <div className="space-y-1.5 font-mono">
                <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">1. Choose Registration Method</label>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <button type="button" onClick={() => { setSignupMethod("phone"); setCustomError(null); }}
                    className={`p-2 border font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${signupMethod === "phone" ? "bg-[#C5A059] text-white border-[#C5A059]" : "bg-white text-[#1E252B] border-[#E5E1D8]"}`}>
                    <Smartphone className="h-3.5 w-3.5" /><span>BD Mobile (+880)</span>
                  </button>
                  <button type="button" onClick={() => { setSignupMethod("email"); setCustomError(null); }}
                    className={`p-2 border font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${signupMethod === "email" ? "bg-[#C5A059] text-white border-[#C5A059]" : "bg-white text-[#1E252B] border-[#E5E1D8]"}`}>
                    <Mail className="h-3.5 w-3.5" /><span>Gmail / Email</span>
                  </button>
                </div>
              </div>

                <form className="space-y-3 font-mono" onSubmit={handleSignupSubmit}>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">Full Legal Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><User className="h-4 w-4" /></div>
                      <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="Advocate Tanvir Rahman" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">Chamber / Law Firm Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Building className="h-4 w-4" /></div>
                      <input type="text" value={chamberName} onChange={(e) => setChamberName(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="Dhaka High Court Annex Chamber" />
                    </div>
                  </div>
                  {signupMethod === "phone" ? (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest flex items-center justify-between">
                        <span>Bangladesh Mobile Number (+880)</span><span className="text-[9px] text-[#C5A059] font-bold">BD (+880)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Phone className="h-4 w-4" /></div>
                        <input type="tel" required value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)}
                          className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="+880 1712-345678" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">Gmail / Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Mail className="h-4 w-4" /></div>
                        <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="advocate.rahman@gmail.com" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#1E252B] uppercase tracking-widest">Account Security Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400"><Key className="h-4 w-4" /></div>
                      <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full text-xs pl-10 pr-3 py-2 bg-[#FDFBF7] border border-[#E5E1D8] focus:border-[#1E252B] outline-none text-[#1E252B]" placeholder="••••••••••••" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting || state.isLoading}
                    className="w-full py-3 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] disabled:bg-neutral-300 font-bold uppercase text-xs tracking-wider border border-[#1E252B] transition cursor-pointer flex items-center justify-center gap-2 mt-4">
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
            </div>
          )}
        </div>
      </div>
      <footer className="text-center text-[10px] font-mono text-[#4A5560] pt-4 border-t border-[#E5E1D8]/50 mt-4">
        <p>Proprietor & Author: <strong className="text-[#1E252B]">Md. Nazmul Islam</strong>, Neum Lex Counsel</p>
        <p className="text-[#C5A059] uppercase tracking-wider font-bold mt-0.5">BCCAA v2.0 Client-Side Secured Engine &bull; Bangladesh General Sign-Up Engine</p>
      </footer>
    </div>
  );
}
