/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Inbox,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";

const Requests = ({ user }: { user?: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const orgId = user?.organizationId;
  const API_URL = "192.168.1.92:8080";

  const fetchRequests = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://${API_URL}/api/workorders?orgId=${orgId}`,
      );
      if (res.ok) {
        const data = await res.json();

        const filteredData = data.filter(
          (wo: any) =>
            wo.category?.toLowerCase().includes("request") ||
            wo.category === "SUPPORT_REQUEST",
        );

        setRequests(filteredData.length > 0 ? filteredData : data);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-10 overflow-y-auto font-sans">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-blue-600 font-bold">Requests</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Maintenance Requests
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-sm"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-gray-500 animate-pulse">
              Loading maintenance requests...
            </p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      REQ #{req.id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === "COMPLETE"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : req.status === "IN_PROGRESS"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {req.status || "OPEN"}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-1">
                    {req.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {req.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{" "}
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-gray-700">
                    Priority:{" "}
                    <span className="font-extrabold text-blue-600">
                      {req.priority || "MEDIUM"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[24px] p-16 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">
              No requests found
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              There are currently no maintenance requests matching your search
              criteria.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Requests;
