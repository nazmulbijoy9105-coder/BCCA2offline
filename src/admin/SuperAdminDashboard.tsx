import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { 
  ShieldAlert, Users, FileText, CheckCircle, XCircle, 
  UserPlus, Award, Clock, RefreshCw, Key, ArrowLeft, Download, ShieldCheck
} from "lucide-react";
import { getAuditQueue, verifyAuditChain, exportAuditLog, clearAuditLog } from "../utils/audit";
import { AuthUser, UserRole } from "../types/auth.types";

export default function SuperAdminDashboard() {
  const { getLicense, createUser, revokeUser, getCurrentUser } = useAuth();
  const currentLicense = getLicense();
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);

  // User form states
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newChamberId, setNewChamberId] = useState(currentUser?.chamberId || "");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchState = () => {
    // Fetch users
    try {
      const stored = localStorage.getItem("_bccaa_users");
      if (stored) setUsers(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }

    // Fetch audits
    setAudits(getAuditQueue().reverse().slice(0, 50)); // Last 50 entries
    setChainValid(verifyAuditChain());
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      await createUser({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole,
        chamberId: newChamberId,
      });

      setFormSuccess(`User ${newEmail} created successfully.`);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      fetchState();
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
    }
  };

  const handleRevokeUser = (userId: string) => {
    if (confirm("Are you sure you want to revoke this user's access?")) {
      try {
        revokeUser(userId);
        fetchState();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExportAudits = () => {
    const dataStr = exportAuditLog();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BCCAA_Audit_Logs_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAudits = () => {
    if (confirm("Are you sure you want to purge all audit records? This is non-reversible.")) {
      clearAuditLog();
      fetchState();
    }
  };

  const currentAdminsCount = users.filter(u => u.role === "admin" && u.isActive).length;
  const currentUsersCount = users.filter(u => u.role === "user" && u.isActive).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E1D8] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C5A059]">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest">Super Admin Cryptographic Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-[Playfair_Display] text-[#1E252B] mt-1">
              Platform Administration
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchState}
              className="p-2 border border-[#E5E1D8] hover:bg-neutral-50 rounded bg-white text-xs font-mono text-[#1E252B] flex items-center gap-2 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync State
            </button>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* License Status Card */}
          <div className="bg-white border border-[#E5E1D8] p-5 rounded-md relative overflow-hidden">
            <div className="absolute right-4 top-4 text-neutral-100">
              <Award className="h-16 w-16" />
            </div>
            <span className="text-[9px] font-mono font-bold text-[#C5A059] uppercase tracking-wider block">License Parameters</span>
            <h3 className="text-lg font-bold font-[Playfair_Display] text-[#1E252B] mt-0.5">
              {currentLicense?.issuedTo || "Trial License"}
            </h3>
            
            <div className="mt-4 space-y-2 text-xs text-[#4A5560]">
              <div className="flex justify-between font-mono">
                <span>License Key Hash:</span>
                <span className="font-bold text-[#1E252B] truncate max-w-[150px]">
                  {currentLicense?.licenseId || "DEMO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tier level:</span>
                <span className="font-bold text-[#1E252B] uppercase">{currentLicense?.tier || "Chamber"}</span>
              </div>
              <div className="flex justify-between">
                <span>Admin Limits:</span>
                <span className="font-bold text-[#1E252B] font-mono">
                  {currentAdminsCount} of {currentLicense?.maxAdmins || 5}
                </span>
              </div>
              <div className="flex justify-between">
                <span>User Limits:</span>
                <span className="font-bold text-[#1E252B] font-mono">
                  {currentUsersCount} of {currentLicense?.maxUsers || 20}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 font-mono">
                <span>Expiration:</span>
                <span className="font-bold text-[#1E252B]">
                  {currentLicense ? new Date(currentLicense.expiresAt).toLocaleDateString() : "365 days"}
                </span>
              </div>
            </div>
          </div>

          {/* User Management Quick Form */}
          <div className="bg-white border border-[#E5E1D8] p-5 rounded-md md:col-span-2">
            <span className="text-[9px] font-mono font-bold text-[#C5A059] uppercase tracking-wider block">Provision User Account</span>
            <h3 className="text-lg font-bold font-[Playfair_Display] text-[#1E252B] mt-0.5 mb-4">
              Create Cryptographic Identity
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 text-xs rounded font-mono">
                  Error: {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded font-mono">
                  Success: {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#1E252B] uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs font-mono p-2 bg-[#FDFBF7] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#C5A059]"
                    placeholder="advocate@chamber.com"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#1E252B] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs p-2 bg-[#FDFBF7] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#C5A059]"
                    placeholder="Adv. Nazmul Islam"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#1E252B] uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs font-mono p-2 bg-[#FDFBF7] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#C5A059]"
                    placeholder="SecurityPassword123!"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#1E252B] uppercase mb-1">Authorization Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs p-2 bg-[#FDFBF7] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#C5A059] font-mono"
                  >
                    <option value="user">User (10 queries/day)</option>
                    <option value="admin">Admin (100 queries/day)</option>
                    <option value="super_admin">Super Admin (Unlimited)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#1E252B] uppercase mb-1">Chamber ID</label>
                  <input
                    type="text"
                    required
                    value={newChamberId}
                    onChange={(e) => setNewChamberId(e.target.value)}
                    className="w-full text-xs font-mono p-2 bg-[#FDFBF7] border border-[#E5E1D8] rounded focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1E252B] hover:bg-[#C5A059] text-white hover:text-[#1E252B] font-bold uppercase text-xs tracking-wider font-mono rounded border border-[#1E252B] hover:border-[#C5A059] transition-all flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" />
                    Provision User
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* User Directories */}
        <div className="bg-white border border-[#E5E1D8] p-5 rounded-md">
          <span className="text-[9px] font-mono font-bold text-[#C5A059] uppercase tracking-wider block">Local Chamber Accounts</span>
          <h3 className="text-lg font-bold font-[Playfair_Display] text-[#1E252B] mt-0.5 mb-4">
            Authorized Account Directory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#E5E1D8]">
              <thead>
                <tr className="bg-[#FDFBF7] font-mono text-[10px] font-bold text-[#1E252B] border-b border-[#E5E1D8]">
                  <th className="p-3 border border-[#E5E1D8]">Name</th>
                  <th className="p-3 border border-[#E5E1D8]">Email</th>
                  <th className="p-3 border border-[#E5E1D8]">Role</th>
                  <th className="p-3 border border-[#E5E1D8]">Quota Used Today</th>
                  <th className="p-3 border border-[#E5E1D8]">Status</th>
                  <th className="p-3 border border-[#E5E1D8]">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#E5E1D8] text-xs">
                    <td className="p-3 font-semibold text-[#1E252B]">{u.name}</td>
                    <td className="p-3 font-mono text-neutral-600">{u.email}</td>
                    <td className="p-3 font-mono text-xs uppercase text-[#C5A059] font-bold">{u.role}</td>
                    <td className="p-3 font-mono">
                      {u.casesToday} / {u.role === "super_admin" ? "Infinity" : u.maxCasesPerDay}
                    </td>
                    <td className="p-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-800 border border-red-200">
                          <XCircle className="h-3 w-3" /> REVOKED
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.isActive && u.id !== currentUser?.id && u.role !== "super_admin" && (
                        <button
                          onClick={() => handleRevokeUser(u.id)}
                          className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono font-bold uppercase tracking-wider transition"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Audit Logs panel */}
        <div className="bg-white border border-[#E5E1D8] p-5 rounded-md space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E1D8] pb-4 gap-4">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#C5A059] uppercase tracking-wider block">Immutable Forensic Ledgers</span>
              <h3 className="text-lg font-bold font-[Playfair_Display] text-[#1E252B] mt-0.5">
                Audit Trail & Chain Verification
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportAudits}
                className="px-3 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-xs font-mono font-bold text-[#1E252B] flex items-center gap-1.5 transition border border-neutral-300"
              >
                <Download className="h-3.5 w-3.5" />
                Export Ledger
              </button>
              <button
                onClick={handleClearAudits}
                className="px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 text-xs font-mono font-bold text-red-600 flex items-center gap-1.5 transition border border-red-200"
              >
                Clear Ledger
              </button>
            </div>
          </div>

          {/* Forensic Integrity Indicator */}
          <div className={`p-4 border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            chainValid === true
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}>
            <div className="flex items-start gap-2.5">
              {chainValid ? (
                <ShieldCheck className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold font-sans">
                  {chainValid ? "✓ Forensic Blockchain Integrity Verified" : "⚠️ Cryptographic Chain Compromised!"}
                </h4>
                <p className="text-xs opacity-85 mt-0.5">
                  {chainValid 
                    ? "Each block's hash correctly reference the prior block's hash. No back-alteration, database injection, or block deletion has occurred."
                    : "A discrepancy was detected in the previous-block hashing cascades. Audit log is un-trusted!"
                  }
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-white text-[10px] font-mono font-bold border tracking-widest uppercase">
              Chain status: {chainValid ? "SECURE" : "UNSECURE"}
            </span>
          </div>

          {/* Audit list */}
          <div className="overflow-y-auto max-h-96 border border-[#E5E1D8] rounded bg-[#FDFBF7] p-3 space-y-2">
            {audits.length === 0 ? (
              <p className="text-xs text-center p-6 text-neutral-400 italic">No audit records logged yet.</p>
            ) : (
              audits.map((a) => (
                <div key={a.eventId} className="bg-white p-3 rounded border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                        a.outcome === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {a.action}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-neutral-600 leading-normal">
                      Operator: <strong className="text-[#1E252B] font-mono">{a.actor.email}</strong> &bull; Resource: <span className="font-mono bg-neutral-100 px-1 rounded">{a.resource.type}:{a.resource.id}</span>
                    </div>
                  </div>
                  <div className="text-right sm:self-center font-mono text-[9px] text-neutral-400">
                    <div>Prev: {a.previousHash.substring(0, 10)}...</div>
                    <div className="text-[#C5A059] font-bold">Curr: {a.currentHash.substring(0, 10)}...</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
