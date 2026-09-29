/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { ShieldAlert, Users, Activity, Lock, KeyRound, Trash2, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

export default function RootDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

const fetchRootData = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) return;
      const [usersRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/root/users?userId=${user.id}`),
        fetch(`${API_URL}/api/root/audit-log?userId=${user.id}`),
      ]);

      if (usersRes.ok) setGlobalUsers(await usersRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
    } catch (err) {
      console.error("Failed to load root data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ROOT") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRootData();
    }
  }, [user]);

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
            <ShieldAlert className="w-4 h-4" /> System Root-Mode Console
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Root Command Center
          </h1>
        </div>
        <button
          onClick={fetchRootData}
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
                      <span className="text-xs font-bold text-green-600">{u.approvalStatus}</span>
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
    </div>
  );
}