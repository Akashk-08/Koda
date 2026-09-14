/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, LayoutGrid, X, ChevronLeft, ChevronRight, MapPin, Calendar, User, SlidersHorizontal, CheckCircle2, Clock, Wrench, ChevronRight as ChevronRightIcon, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ITEMS_PER_PAGE = 50;
const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIES = [
  "ANNUAL_PREVENTIVE_MAINTENANCE",
  "ASSETS",
  "LARGE_DAMAGE",
  "PARTS_REQUEST",
  "PROJECT_UPGRADE",
  "SIX_MONTH_PREVENTIVE_MAINTENANCE",
  "SUPPORT_REQUEST",
  "WEEKLY_MONTHLY_CHECKLISTS",
];

const WorkOrders = ({ user, onOpenModal }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [workOrders, setWorkOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine user access level based on location
  const isFullAccess = user?.role === 'ADMIN' ||
    user?.siteLocation === 'Pulseworks Shop' ||
    user?.siteLocation === 'Pulseworks Warehouse';

  // Read initial states from URL parameters (or defaults)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "ALL");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("locationName") || "ALL");
  const [teamFilter, setTeamFilter] = useState(searchParams.get("teamId") || "ALL");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "ALL");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1", 10));

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(
    Boolean(searchParams.get("status") || searchParams.get("category") || searchParams.get("priority") || searchParams.get("locationName"))
  );

  // Server-Side Pagination State
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

  // Sync state changes back to URL query parameters
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (categoryFilter !== "ALL") params.category = categoryFilter;
    if (locationFilter !== "ALL") params.locationName = locationFilter;
    if (teamFilter !== "ALL") params.teamId = teamFilter;
    if (priorityFilter !== "ALL") params.priority = priorityFilter;
    if (currentPage > 1) params.page = currentPage.toString();

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, statusFilter, categoryFilter, locationFilter, teamFilter, priorityFilter, currentPage, setSearchParams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, locationFilter, teamFilter, priorityFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setLocationFilter("ALL");
    setTeamFilter("ALL");
    setPriorityFilter("ALL");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = searchQuery || statusFilter !== "ALL" || categoryFilter !== "ALL" || locationFilter !== "ALL" || priorityFilter !== "ALL";

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

      // --- ENFORCE STRICT SITE-LEVEL VISIBILITY ---
      if (isFullAccess) {
        if (locationFilter !== "ALL") {
          params.append("locationName", locationFilter);
        }
      } else if (user?.siteLocation) {
        // Force the API to only return work orders for the restricted user's assigned site
        const cleanLoc = user.siteLocation.includes(",")
          ? user.siteLocation.split(",")[0].trim()
          : user.siteLocation;
        params.append("locationName", cleanLoc);
      }

      if (teamFilter !== "ALL") params.append("teamId", teamFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const [woRes, locRes, teamsRes] = await Promise.all([
        fetch(`${API_URL}/api/workorders?${params.toString()}`),
        fetch(`${API_URL}/api/locations?orgId=${orgId}`),
        fetch(`${API_URL}/api/teams?orgId=${orgId}`)
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
  }, [orgId, userId, currentPage, debouncedSearch, statusFilter, categoryFilter, locationFilter, teamFilter, priorityFilter, isFullAccess, user?.siteLocation]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // UI Helpers
  const getPriorityUI = (priority) => {
    switch (priority) {
      case "CRITICAL": return { bg: "bg-red-50 text-red-700 border-red-200"};
      case "HIGH": return { bg: "bg-orange-50 text-orange-700 border-orange-200"};
      case "MEDIUM": return { bg: "bg-amber-50 text-amber-700 border-amber-200" };
      case "LOW": return { bg: "bg-blue-50 text-blue-700 border-blue-200"};
      default: return { bg: "bg-gray-50 text-gray-600 border-gray-200" };
    }
  };

  const getStatusUI = (status) => {
    switch (status) {
      case "OPEN": return { bg: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" };
      case "COMPLETE": return { bg: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" };
      case "CLOSED": return { bg: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" };
      default: return { bg: "text-gray-700 bg-gray-50 border-gray-200", dot: "bg-gray-500" };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-4 md:p-8 overflow-y-auto font-sans pb-24 md:pb-8 relative z-0">

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
          className="hidden md:flex bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-5 py-2.5 rounded-xl text-sm font-bold items-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {/* REDESIGNED SEARCH & FILTER DASHBOARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 p-4 shrink-0 relative z-10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by Title or Number (#13823)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-black transition-all shrink-0 ${hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* EXPANDED ADVANCED FILTERS PANEL */}
        {isAdvancedFiltersOpen && (
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* Status Select */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="COMPLETE">Complete</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Location Select (Only visible for Admins / Shop / Warehouse) */}
              {isFullAccess && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority Select */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

            </div>

            {/* CLEAR FILTER BUTTON */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2 border-t border-gray-50">
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
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
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-500 shadow-sm">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-black text-gray-900">No work orders found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Try adjusting your search query or filter options.</p>
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-3 relative z-0">
            {workOrders.map((wo) => {
              return (
                <div
                  key={wo.id}
                  onClick={() => navigate(`/workspace/workorder/${wo.id}`)}
                  className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer relative space-y-3 group"
                >
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusUI(wo.status).bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusUI(wo.status).dot}`}></span>
                      {wo.status.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-gray-400">#{wo.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getPriorityUI(wo.priority).bg}`}>
                        {wo.priority}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {wo.title}
                  </h3>

                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-gray-500">
                    <div className="flex items-center gap-3">
                      {wo.locationName && (
                        <span className="flex items-center gap-1 text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{wo.locationName}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(wo.createdAt).toLocaleDateString()}</span>
                      <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors ml-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:flex bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex-col relative z-0">
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
                    const priorityUI = getPriorityUI(wo.priority);
                    const statusUI = getStatusUI(wo.status);

                    return (
                      <tr
                        key={wo.id}
                        onClick={() => navigate(`/workspace/workorder/${wo.id}`)}
                        className="hover:bg-blue-50/40 transition-all cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-black text-gray-600 shadow-sm">
                            WO-{wo.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors block mb-0.5">
                            {wo.title}
                          </span>
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xl font-medium">
                            {wo.description || 'No description provided.'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {wo.assignee ? (
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                {wo.assignee.firstName ? wo.assignee.firstName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="text-sm text-gray-800 font-bold truncate max-w-[120px]">{assigneeName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-gray-400">
                              <div className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                                U
                              </div>
                              <span className="text-sm italic font-medium">Unassigned</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${priorityUI.bg}`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${statusUI.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusUI.dot}`}></span>
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
        <div className="px-6 py-4 mt-4 border border-gray-200 bg-white rounded-2xl flex items-center justify-between shrink-0 shadow-sm relative z-0">
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