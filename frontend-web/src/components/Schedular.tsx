/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  ArrowRight,
  ArrowLeft,
  Box,
  MapPin,
  X,
  CheckSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Scheduler = ({ user }: any) => {
  const navigate = useNavigate();
  const [pmSchedules, setPmSchedules] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View & Filter States
  const [viewMode, setViewMode] = useState<"Day" | "Week">("Week");
  const [currentDate, setCurrentDate] = useState(new Date("2026-08-17T12:00:00")); // Defaulting to your data date
  const [searchQuery, setSearchQuery] = useState("");

  // Editable Toolbar Filters
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");

  // Centered Inspection Modal State
  const [selectedPM, setSelectedPM] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "assignment" | "tasks" | "activity">(
    "details",
  );

  const orgId = user?.organizationId;
  const userId = user?.id;
  const API_URL = import.meta.env.VITE_API_URL;
  const fetchSchedulerData = useCallback(async () => {
    if (!orgId || !userId) return;
    setIsLoading(true);
    try {
      const [pmRes, usersRes, locRes, teamsRes] = await Promise.all([
        fetch(`${API_URL}/api/pm?orgId=${orgId}&userId=${userId}`),
        fetch(`${API_URL}/api/users/${orgId}`),
        fetch(`${API_URL}/api/locations?orgId=${orgId}`),
        fetch(`${API_URL}/api/teams?orgId=${orgId}`),
      ]);

      if (pmRes.ok) setPmSchedules(await pmRes.json());
      if (usersRes.ok) setTeamMembers(await usersRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch (err) {
      console.error("Failed to load scheduler data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    fetchSchedulerData();
  }, [fetchSchedulerData]);

  // SMART FREQUENCY FILTERING
  const filteredPMs = pmSchedules.filter((pm) => {
    const title = pm.title?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    if (!title.includes(query)) return false;

    if (frequencyFilter === "ALL") return true;

    const schedType = pm.scheduleType?.toUpperCase() || "";
    if (frequencyFilter === "YEARLY") return schedType === "YEARLY" || title.includes("annual");
    if (frequencyFilter === "MONTHLY") return schedType === "MONTHLY" || title.includes("monthly");
    if (frequencyFilter === "WEEKLY") return schedType === "WEEKLY" || title.includes("weekly");
    if (frequencyFilter === "QUARTERLY") return schedType === "QUARTERLY";

    return schedType === frequencyFilter;
  });

  const unassignedPMs = filteredPMs.filter((pm) => !pm.assigneeId);
  const assignedPMs = filteredPMs.filter((pm) => pm.assigneeId);

  const hours = [
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timelineColumns = viewMode === "Day" ? hours : weekDays;

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden font-sans relative">
      {/* HEADER BAR */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
              <span>Workspace</span> <span className="mx-2">/</span>{" "}
              <span className="text-blue-600">Scheduler</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              PM Dispatch & Timeline Board
            </h1>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search PM schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all w-60 shadow-sm"
          />
        </div>
      </div>

      {/* EDITABLE FILTER TOOLBAR */}
      <div className="bg-white border-b border-gray-200 px-8 py-3 flex flex-wrap items-center gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" /> Filters:
        </div>

        <select
          value={frequencyFilter}
          onChange={(e) => setFrequencyFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 outline-none"
        >
          <option value="ALL">All Frequencies</option>
          <option value="YEARLY">Yearly / Annual</option>
          <option value="MONTHLY">Monthly</option>
          <option value="WEEKLY">Weekly</option>
        </select>
      </div>

      {/* UNSCHEDULED PM BACKLOG TRAY */}
      <div className="bg-white border-b border-gray-200 p-5 shrink-0 shadow-inner">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Unassigned Preventive Maintenance Backlog
            </h3>
            {/* GRADIENT BADGE */}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
              {unassignedPMs.length}
            </span>
          </div>
          <span className="text-xs font-medium text-gray-400">
            Click any card to inspect and dispatch
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {unassignedPMs.length === 0 ? (
            <div className="text-xs text-gray-400 italic py-3 px-2">
              No unassigned PMs matching filters.
            </div>
          ) : (
            unassignedPMs.map((pm) => (
              <div
                key={pm.id}
                onClick={() => setSelectedPM(pm)}
                className="min-w-[280px] bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-3.5 shadow-sm cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between shrink-0"
              >
                <div>
                  <div className="flex justify-between items-start mb-1.5">
                    {/* GRADIENT FREQUENCY BADGE */}
                    <span className="text-[10px] font-black text-white bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                      {pm.scheduleType}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">
                      Due: {new Date(pm.nextDueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {pm.title}
                  </h4>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium">
                  <span className="truncate max-w-[180px]">
                    📋 {pm.taskData?.length || 1} SOP Tasks
                  </span>
                  {/* GRADIENT TEXT */}
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Automated
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DATE & VIEW CONTROLS */}
      <div className="bg-gray-100/80 px-8 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("Day")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "Day" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow border-0" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode("Week")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "Week" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow border-0" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Week View
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - (viewMode === "Week" ? 7 : 1));
                setCurrentDate(d);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold text-gray-800 px-2">
              {currentDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + (viewMode === "Week" ? 7 : 1));
                setCurrentDate(d);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm transition-all"
        >
          Today
        </button>
      </div>

      {/* TEAM MEMBER & PM TIMELINE MATRIX */}
      <div className="flex-1 overflow-auto bg-white flex flex-col relative">
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-black text-gray-400 uppercase tracking-wider w-72 border-r border-gray-200 bg-gray-50">
                Team Members ({teamMembers.length})
              </th>
              {timelineColumns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3.5 text-center text-xs font-bold text-gray-500 border-r border-gray-100 whitespace-nowrap min-w-[130px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={timelineColumns.length + 1}
                  className="py-24 text-center text-gray-500 font-medium"
                >
                  Loading PM schedule matrix...
                </td>
              </tr>
            ) : teamMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={timelineColumns.length + 1}
                  className="py-24 text-center text-gray-500"
                >
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-bold text-gray-900">No team members found</p>
                </td>
              </tr>
            ) : (
              teamMembers.map((member) => {
                const memberPMs = assignedPMs.filter((pm) => pm.assigneeId === member.id);

                return (
                  <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 border-r border-gray-100 bg-gray-50/40">
                      <div className="flex items-center gap-3">
                        {/* GRADIENT AVATAR */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm">
                          {member.firstName?.charAt(0)}
                          {member.lastName?.charAt(0)}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {member.firstName} {member.lastName}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {member.role || "Technician"} • {memberPMs.length} PMs
                          </span>
                        </div>
                      </div>
                    </td>

                    {timelineColumns.map((_, colIdx) => {
                      // REAL DATE MATCHING LOGIC
                      let matchingPM: any = null;
                      memberPMs.forEach((pm) => {
                        const pmDate = new Date(pm.nextDueDate);
                        if (viewMode === "Day") {
                          if (pmDate.toDateString() === currentDate.toDateString() && colIdx === 1)
                            matchingPM = pm;
                        } else {
                          const jsDay = pmDate.getDay();
                          const colDayMatch = jsDay === 0 ? 6 : jsDay - 1;
                          if (colDayMatch === colIdx) matchingPM = pm;
                        }
                      });

                      return (
                        <td
                          key={colIdx}
                          className="p-2 border-r border-gray-50 align-top h-24 min-w-[130px] relative"
                        >
                          {matchingPM && (
                            <div
                              onClick={() => setSelectedPM(matchingPM)}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-2.5 shadow-md cursor-pointer transition-all transform hover:scale-[1.02] absolute inset-x-2 top-2 z-10 border-0"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded uppercase font-bold">
                                  {matchingPM.scheduleType}
                                </span>
                                <span className="text-[10px] opacity-90">🛡️ PM</span>
                              </div>
                              <p className="text-xs font-bold truncate text-white">
                                {matchingPM.title}
                              </p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CENTERED INSPECTION MODAL */}
      {selectedPM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* GRADIENT BADGE IN MODAL */}
                <span className="text-xs font-black text-white bg-gradient-to-r from-blue-600 to-purple-600 px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
                  {selectedPM.scheduleType}
                </span>
                <h3 className="text-xl font-black text-gray-900 truncate max-w-md">
                  {selectedPM.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPM(null)}
                className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-colors shadow-sm border border-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 bg-white px-8 gap-8 shrink-0 overflow-x-auto">
              {(["details", "assignment", "tasks", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all capitalize whitespace-nowrap ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-8 flex-1 overflow-y-auto space-y-6 bg-gray-50/50">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      PM Trigger Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">Next Due Date</span>
                        <span className="font-bold text-gray-800 text-base">
                          📅 {new Date(selectedPM.nextDueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">Frequency</span>
                        {/* GRADIENT TEXT IN MODAL */}
                        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 uppercase text-base">
                          {selectedPM.scheduleType}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Description</span>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {selectedPM.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assignment" && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Technician & Team Assignment
                  </h4>

                  {/*  Display Legacy UpKeep Import Data if it exists  */}
                  {selectedPM.taskData &&
                    !Array.isArray(selectedPM.taskData) &&
                    selectedPM.taskData.primaryAssigneeEmail &&
                    selectedPM.taskData.primaryAssigneeEmail !== "Unassigned" && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
                        <h5 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2">
                          📦 Imported UpKeep Assignments
                        </h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-blue-600/80 block">
                              Legacy Assignee Email
                            </span>
                            <span className="font-bold text-blue-900 truncate block">
                              {selectedPM.taskData.primaryAssigneeEmail}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-600/80 block">Legacy Team Name</span>
                            <span className="font-bold text-blue-900 truncate block">
                              {selectedPM.taskData.teamName || "None"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-3 font-medium bg-blue-100/50 p-2 rounded-lg">
                          Please select the corresponding Koda users from the dropdowns below to
                          officially map these assignments.
                        </p>
                      </div>
                    )}

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Primary Assignee
                    </label>
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium"
                      defaultValue={selectedPM.assigneeId || ""}
                    >
                      <option value="">Unassigned</option>
                      {/* Corrected map variable here to use 'teamMembers' instead of 'orgUsers' */}
                      {teamMembers.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Assigned Team
                    </label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium">
                      <option value="">No Team</option>
                      {/* Corrected map variable here to use 'teams' instead of 'orgTeams' */}
                      {teams.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Standard Checklists
                  </h4>
                  <div className="space-y-2">
                    {selectedPM.taskData &&
                    Array.isArray(selectedPM.taskData) &&
                    selectedPM.taskData.length > 0 ? (
                      selectedPM.taskData.map((task: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800"
                        >
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                          <span>{task.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 italic py-6 text-center">
                        No checklist steps added to this template yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Internal Updates & Activity
                  </h4>
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <span className="font-bold text-gray-800 block mb-0.5">
                        System Automated Trigger
                      </span>
                      PM schedule successfully initialized and synchronized with database.
                    </div>
                  </div>
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Write internal update..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-5 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
              <button
                onClick={() => setSelectedPM(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => (window.location.href = "/workspace/pm")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                Manage Template <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Scheduler;
