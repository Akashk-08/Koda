/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, LayoutGrid, X, ChevronLeft, ChevronRight, MapPin, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 50;
const API_URL = "192.168.1.92:8080";

const WorkOrders = ({ user, onOpenModal }) => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const orgId = user?.organizationId;
  const userId = user?.id;

  // Search Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, locationFilter, teamFilter]);

  const fetchData = useCallback(async () => {
    if (!orgId || !userId) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        orgId,
        userId,
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (locationFilter !== "ALL") params.append("locationName", locationFilter);
      if (teamFilter !== "ALL") params.append("teamId", teamFilter);

      const [woRes, locRes, teamsRes] = await Promise.all([
        fetch(`http://${API_URL}/api/workorders?${params.toString()}`),
        fetch(`http://${API_URL}/api/locations?orgId=${orgId}`),
        fetch(`http://${API_URL}/api/teams?orgId=${orgId}`)
      ]);

      if (woRes.ok) {
        const json = await woRes.json();
        setWorkOrders(json.data);
        setTotalPages(json.meta.totalPages);
        setTotalRecords(json.meta.totalRecords);
      }
      if (locRes.ok) setLocations(await locRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch (err) {
      console.error("Failed to fetch Work Orders data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, userId, currentPage, debouncedSearch, statusFilter, categoryFilter, locationFilter, teamFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // UI Helpers
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "OPEN": return "text-blue-600 bg-blue-50 border-blue-100";
      case "IN_PROGRESS": return "text-purple-600 bg-purple-50 border-purple-100";
      case "COMPLETE": return "text-green-600 bg-green-50 border-green-100";
      case "REVIEW": return "text-orange-600 bg-orange-50 border-orange-100";
      case "CLOSED": return "text-gray-500 bg-gray-50 border-gray-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-4 md:p-8 overflow-y-auto font-sans pb-24 md:pb-8">

      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="hidden md:flex items-center text-sm text-gray-500 mb-2">
            <span>Workspace</span> <span className="mx-2">/</span> <span>Work Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Work Orders</h1>
        </div>
        <button
          onClick={onOpenModal}
          className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-5 py-2.5 rounded-xl text-sm font-bold items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {/* SEARCH & FILTER DASHBOARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 p-4 shrink-0">
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by Title or Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-gray-100">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="onHOLD">On Hold</option>
            <option value="COMPLETE">Complete</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Categories</option>
            <option value="SUPPORT_REQUEST">Support Request</option>
            <option value="PARTS_REQUEST">Parts Request</option>
            <option value="WEEKLY_MONTHLY_CHECKLISTS">Checklists</option>
            <option value="PROJECT_UPGRADE">Project Upgrade</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>

          {(statusFilter !== "ALL" || categoryFilter !== "ALL" || locationFilter !== "ALL" || searchQuery !== "") && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
                setLocationFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors ml-auto flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* CONTENT AREA: RESPONSIVE CARDS FOR MOBILE & TABLE FOR DESKTOP */}
      {isLoading ? (
        <div className="py-24 text-center text-gray-500 font-medium">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading Work Orders...
          </div>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-sm">
          <LayoutGrid className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-bold text-gray-900">No work orders found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW (Visible only on Mobile) */}
          <div className="md:hidden space-y-3">
            {workOrders.map((wo) => {
              const assigneeName = wo.assignee ? `${wo.assignee.firstName || ''} ${wo.assignee.lastName || ''}`.trim() : 'Unassigned';

              return (
                <div
                  key={wo.id}
                  onClick={() => navigate(`/workspace/workorder/${wo.id}`)}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer relative space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(wo.status)}`}>
                      {wo.status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{wo.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug">
                    {wo.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{wo.locationName || 'Main Facility'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{assigneeName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Visible only on Desktop) */}
          <div className="hidden md:flex bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider w-28">Ticket</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">Title / Description</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider w-48">Assignee</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider w-32">Priority</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider w-36">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {workOrders.map((wo) => {
                    const assigneeName = wo.assignee ? `${wo.assignee.firstName || ''} ${wo.assignee.lastName || ''}`.trim() : 'Unassigned';

                    return (
                      <tr
                        key={wo.id}
                        onClick={() => navigate(`/workspace/workorder/${wo.id}`)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-black text-gray-900">WO-{wo.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors block mb-1">
                            {wo.title}
                          </span>
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xl">
                            {wo.description || 'No description provided.'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {wo.assignee ? (
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2 shrink-0">
                                {wo.assignee.firstName ? wo.assignee.firstName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="text-sm text-gray-900 font-medium truncate max-w-[120px]">{assigneeName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400">
                              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold mr-2 shrink-0">U</div>
                              <span className="text-sm italic">Unassigned</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(wo.priority)}`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${getStatusColor(wo.status)}`}>
                            {wo.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* PAGINATION FOOTER */}
      {!isLoading && totalRecords > 0 && (
        <div className="px-6 py-4 mt-4 border border-gray-200 bg-white rounded-2xl flex items-center justify-between shrink-0 shadow-sm">
          <span className="text-xs md:text-sm text-gray-500 font-medium">
            <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
            <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)}</span> of
            <span className="font-bold text-gray-900"> {totalRecords}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs md:text-sm font-bold text-gray-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;