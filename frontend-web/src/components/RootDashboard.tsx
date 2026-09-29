/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { ShieldAlert, Users, Activity, RefreshCw, KeyRound, X, Check, Lock } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export default function RootDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Override Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [overridePassword, setOverridePassword] = useState("");
  const [overridePin, setOverridePin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const fetchRootData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    try {
      if (!user?.id) return;
      const headers = { "x-user-id": user.id };
      const [usersRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/root/users?userId=${user.id}`, { headers }),
        fetch(`${API_URL}/api/root/audit-log?userId=${user.id}`, { headers }),
      ]);

      if (usersRes.ok) setGlobalUsers(await usersRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch {
      console.error("Failed to load root data");
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Changed to [user] to satisfy React Compiler

  useEffect(() => {
    if (user?.role === "ROOT") {
      // Pass false to skip synchronous setState on mount, avoiding the ESLint warning
      fetchRootData(false);
    }
  }, [user, fetchRootData]); // Changed to [user] to satisfy React Compiler

  const handleOpenOverride = (targetUser: any) => {
    setSelectedUser(targetUser);
    setOverridePassword("");
    setOverridePin(targetUser.pin || "");
    setActionSuccessMsg("");
  };

  const handleSaveCredentials = async () => {
    if (!selectedUser) return;
    if (!overridePassword.trim() && overridePin === (selectedUser.pin || "")) {
      alert("Please provide a new password or change the PIN.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/root/users/${selectedUser.id}/credentials`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          newPassword: overridePassword.trim() || undefined,
          newPin: overridePin.trim() || null,
          requesterId: user.id,
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(`Credentials for ${selectedUser.email} updated successfully!`);
        setTimeout(() => {
          setSelectedUser(null);
          fetchRootData(true);
        }, 1200);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update credentials");
      }
    } catch {
      alert("Server error updating credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "ROOT") {
    return (
      <div className="p-10 text-center text-red-600 font-bold text-xl">
        Access Denied. Root Privileges Required.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-6 md:p-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 gap-1.5">
            <ShieldAlert className="w-4 h-4" /> System God-Mode Console
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Root Command Center
          </h1>
        </div>
        <button
          onClick={() => fetchRootData(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "users"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Users className="w-4 h-4" /> Global Users & PINs ({globalUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "audit"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Activity className="w-4 h-4" /> Global Audit Trail ({auditLogs.length})
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="py-20 text-center text-gray-400 font-medium text-sm">
            Loading secure root data...
          </div>
        ) : activeTab === "users" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">User Name</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Shared PIN</th>
                  <th className="px-6 py-4 text-left">Organization ID</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Emergency Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                {globalUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                          u.role === "ROOT"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-purple-600">
                      {u.pin ? u.pin : <span className="text-gray-300 font-normal">Not Set</span>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{u.organizationId}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold ${
                          u.approvalStatus === "APPROVED"
                            ? "text-green-600"
                            : u.approvalStatus === "REJECTED"
                            ? "text-red-500"
                            : "text-amber-500"
                        }`}
                      >
                        {u.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenOverride(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all shadow-2xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Override Credentials
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Timestamp</th>
                  <th className="px-6 py-4 text-left">Actor (User)</th>
                  <th className="px-6 py-4 text-left">Action Type</th>
                  <th className="px-6 py-4 text-left">Captured Details (Ghost Deletes / Edits)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {log.actor?.firstName} {log.actor?.lastName}
                      <span className="block text-xs font-normal text-gray-400">
                        {log.actor?.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs bg-gray-50/50 rounded-lg">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EMERGENCY CREDENTIAL OVERRIDE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-purple-700 font-black text-sm uppercase tracking-wide">
                <Lock className="w-4 h-4" /> Emergency Override
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Target Account
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                </p>
              </div>

              {actionSuccessMsg ? (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" /> {actionSuccessMsg}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      New Password (Minimum 6 characters)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to keep unchanged"
                      value={overridePassword}
                      onChange={(e) => setOverridePassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Shared Terminal 4-Digit PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g., 1234"
                      value={overridePin}
                      onChange={(e) => setOverridePin(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold tracking-widest text-center outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {!actionSuccessMsg && (
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Applying..." : "Save & Override"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}