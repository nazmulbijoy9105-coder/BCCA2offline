import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupMethod, setSignupMethod] = useState<"gmail" | "phone" | "email">("email");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [chamberName, setChamberName] = useState("");

  const { login, registerUser, state: authState } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(loginIdentifier, loginPassword);
      } else {
        await registerUser({
          name: fullName,
          email: signupMethod === "gmail" || signupMethod === "email" ? signupEmail : undefined,
          phone: signupMethod === "phone" ? signupPhone : undefined,
          password: signupPassword,
          chamberName,
          authMethod: signupMethod,
        });
      }
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] bg-gradient-to-b from-[#0B0F19] to-[#111827] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md w-full mx-auto glass-panel rounded-2xl overflow-hidden relative z-10">
        <div className="px-8 pt-8 pb-6 border-b border-white/10">
          <h2 className="text-3xl font-serif font-bold text-gold tracking-tight">
            {isLogin ? "BCCAA Platform" : "Create Account"}
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            {isLogin ? "Sign in to your secure legal workspace" : "Register your chamber account"}
          </p>
        </div>

        <div className="p-8">
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${isLogin ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-300"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${!isLogin ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-slate-300"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Email or Phone</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <input type="text" autoComplete="username" required value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="w-full text-sm pl-10 pr-3 py-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="lawyer@gmail.com or +880 1712-345678" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Password</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input type="password" autoComplete="current-password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full text-sm pl-10 pr-3 py-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="••••••••••••" />
                  </div>
                </div>

                <div className="flex items-center justify-end mb-4">
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">Forgot Password?</button>
                </div>

                {authState.error && <div className="text-red-400 text-xs mb-4">{authState.error}</div>}
                
                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-[#0B0F19] bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F19] focus:ring-amber-500 transition-all duration-200">
                  Sign In
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full text-sm p-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Chamber Name</label>
                  <input type="text" value={chamberName} onChange={(e) => setChamberName(e.target.value)} className="w-full text-sm p-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="Doe & Associates" />
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <button type="button" onClick={() => setSignupMethod("email")} className={`flex-1 py-2 text-xs font-medium rounded-lg ${signupMethod === "email" ? "bg-amber-400 text-[#0B0F19]" : "bg-white/5 text-slate-400"}`}>Email</button>
                  <button type="button" onClick={() => setSignupMethod("phone")} className={`flex-1 py-2 text-xs font-medium rounded-lg ${signupMethod === "phone" ? "bg-amber-400 text-[#0B0F19]" : "bg-white/5 text-slate-400"}`}>Phone</button>
                  <button type="button" onClick={() => setSignupMethod("gmail")} className={`flex-1 py-2 text-xs font-medium rounded-lg ${signupMethod === "gmail" ? "bg-amber-400 text-[#0B0F19]" : "bg-white/5 text-slate-400"}`}>Gmail</button>
                </div>

                {signupMethod === "phone" && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Phone Number</label>
                    <input type="tel" required value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="w-full text-sm p-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="+880 1712-345678" />
                  </div>
                )}
                {signupMethod === "gmail" || signupMethod === "email" ? (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Email Address</label>
                    <input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full text-sm p-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="lawyer@gmail.com" />
                  </div>
                ) : null}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest mb-1">Password</label>
                  <input type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full text-sm p-3 bg-white/5 border border-white/10 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10 outline-none text-white rounded-lg transition-all" placeholder="Minimum 12 characters" />
                </div>

                {authState.error && <div className="text-red-400 text-xs mb-4">{authState.error}</div>}

                <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-[#0B0F19] bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F19] focus:ring-amber-500 transition-all duration-200">
                  Create Account
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif font-bold text-gold">Account Recovery</h2>
              <button onClick={() => setShowForgotPassword(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-6">For security reasons, passwords cannot be recovered online. Please contact your Chamber Administrator or the Super Admin to reset your credentials.</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-400 mb-1">Admin Contact:</p>
              <p className="text-sm text-white font-mono">super_admin@bccaa.com</p>
            </div>
            <button onClick={() => setShowForgotPassword(false)} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-bold text-[#0B0F19] bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-400 hover:to-amber-600 transition-all duration-200">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
