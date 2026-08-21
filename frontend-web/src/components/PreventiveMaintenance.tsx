/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Clock,
  ShieldCheck,
  MapPin,
  Users,
  Box,
  Wrench,
  X,
  Search,
  FileText,
  Trash2,
  ArrowRight,
  CheckSquare,
} from "lucide-react";

const PreventiveMaintenance = ({ user }: any) => {
  const [pms, setPms] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data for Dropdowns
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgAssets, setOrgAssets] = useState<any[]>([]);
  const [orgTeams, setOrgTeams] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);

  // Centered Inspection Modal State (Restored normal view)
  const [selectedPM, setSelectedPM] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "assignment" | "tasks" | "activity"
  >("details");

  const orgId = user?.organizationId;
  const userId = user?.id;

  const fetchPMs = useCallback(async () => {
    if (!orgId || !userId) return;
    try {
      const res = await fetch(
        `http://${API_URL}/api/pm?orgId=${orgId}&userId=${userId}`,
      );
      if (res.ok) setPms(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [orgId, userId]);
  const API_URL = "192.168.1.92:8080";

  const fetchDependencies = useCallback(async () => {
    if (!orgId) return;
    try {
      const [usersRes, assetsRes, teamsRes, partsRes, locRes] =
        await Promise.all([
          fetch(`http://${API_URL}/api/users/${orgId}`),
          fetch(`http://${API_URL}/api/assets?orgId=${orgId}`),
          fetch(`http://${API_URL}/api/teams?orgId=${orgId}`),
          fetch(`http://${API_URL}/api/inventory?orgId=${orgId}`),
          fetch(`http://${API_URL}/api/locations?orgId=${orgId}`),
        ]);
      if (usersRes.ok) setOrgUsers(await usersRes.json());
      if (assetsRes.ok) setOrgAssets(await assetsRes.json());
      if (teamsRes.ok) setOrgTeams(await teamsRes.json());
      if (partsRes.ok) setOrgParts(await partsRes.json());
      if (locRes.ok) setOrgLocations(await locRes.json());
    } catch (error) {
      console.error("Failed to load PM dependencies:", error);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPMs();
    fetchDependencies();
  }, [fetchPMs, fetchDependencies]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 p-8 overflow-y-auto font-sans relative">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Workspace</span> <span className="mx-2">/</span>{" "}
            <span>Preventive Maintenance</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            PM Schedules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated recurring work orders based on UpKeep-grade master
            templates.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create PM Master Schedule
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                PM Template Title
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Next Auto-WO Date
              </th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                Default Assignee
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pms.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-500">
                  <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-bold text-gray-900">
                    No schedules configured
                  </p>
                  <p className="text-sm mt-1">
                    Create a template to automate your maintenance cycles.
                  </p>
                </td>
              </tr>
            ) : (
              pms.map((pm) => (
                <tr
                  key={pm.id}
                  onClick={() => setSelectedPM(pm)}
                  className="hover:bg-purple-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {pm.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-sm mt-0.5">
                      {pm.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-black tracking-wider uppercase border border-purple-100 shadow-sm">
                      <Clock className="w-3.5 h-3.5" /> {pm.scheduleType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">
                    {new Date(pm.nextDueDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400 shrink-0" />
                    <span
                      className="truncate max-w-[200px]"
                      title={
                        pm.assignee
                          ? `${pm.assignee.firstName} ${pm.assignee.lastName}`
                          : pm.taskData?.primaryAssigneeEmail || "Unassigned"
                      }
                    >
                      {pm.assignee ? (
                        `${pm.assignee.firstName} ${pm.assignee.lastName}`
                      ) : pm.taskData &&
                        !Array.isArray(pm.taskData) &&
                        pm.taskData.primaryAssigneeEmail &&
                        pm.taskData.primaryAssigneeEmail !== "Unassigned" ? (
                        <span className="text-blue-600 font-bold">
                          {pm.taskData.primaryAssigneeEmail}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NORMAL CENTERED INSPECTION MODAL */}
      {selectedPM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 uppercase">
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
              {(["details", "assignment", "tasks", "activity"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all capitalize whitespace-nowrap ${activeTab === tab ? "border-purple-600 text-purple-700" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                  >
                    {tab}
                  </button>
                ),
              )}
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
                        <span className="text-xs text-gray-400 block mb-1">
                          Next Due Date
                        </span>
                        <span className="font-bold text-gray-800 text-base">
                          📅{" "}
                          {new Date(
                            selectedPM.nextDueDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block mb-1">
                          Frequency
                        </span>
                        <span className="font-bold text-purple-700 uppercase text-base">
                          {selectedPM.scheduleType}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">
                        Description
                      </span>
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

                  {/* --- Display Legacy UpKeep Import Data if it exists --- */}
                  {selectedPM.taskData &&
                    !Array.isArray(selectedPM.taskData) &&
                    selectedPM.taskData.primaryAssigneeEmail &&
                    selectedPM.taskData.primaryAssigneeEmail !==
                      "Unassigned" && (
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
                            <span className="text-xs text-blue-600/80 block">
                              Legacy Team Name
                            </span>
                            <span className="font-bold text-blue-900 truncate block">
                              {selectedPM.taskData.teamName || "None"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 mt-3 font-medium bg-blue-100/50 p-2 rounded-lg">
                          Please select the corresponding Koda users from the
                          dropdowns below to officially map these assignments.
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
                      {orgUsers.map((m: any) => (
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
                      {orgTeams.map((t: any) => (
                        <option key={t.id} value={t.name}>
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
                          <CheckSquare className="w-4 h-4 text-purple-600" />
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
                      PM schedule successfully initialized and synchronized with
                      database.
                    </div>
                  </div>
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Write internal update..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-600"
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
                onClick={() => (window.location.href = "/workspace/schedular")}
                className="px-6 py-2.5 text-sm font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md flex items-center gap-2"
              >
                View on Scheduler <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CreatePMModal
          user={user}
          orgUsers={orgUsers}
          orgAssets={orgAssets}
          orgTeams={orgTeams}
          orgParts={orgParts}
          orgLocations={orgLocations}
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setIsModalOpen(false);
            fetchPMs();
          }}
        />
      )}
    </div>
  );
};

const CreatePMModal = ({
  user,
  orgUsers,
  orgAssets,
  orgTeams,
  orgParts,
  orgLocations,
  onClose,
  onCreated,
}: any) => {
  const [activeTab, setActiveTab] = useState<"details" | "schedule" | "assets">(
    "details",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    workOrderTitle: "",
    description: "",
    priority: "MEDIUM",
    category: "WEEKLY_MONTHLY_CHECKLISTS",
    durationHours: "",
    requiresSignature: false,
    scheduleType: "MONTHLY",
    firstDueDate: "",
    assigneeId: "",
    teamId: "",
    assetId: "",
  });

  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Review Daily Checklists & Attach pictures",
      type: "Inspection",
    },
    {
      id: 2,
      text: "Check and test functionality of E-Stop button",
      type: "Inspection",
    },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedParts, setSelectedParts] = useState<any[]>([]);

  const [assetRows, setAssetRows] = useState([
    {
      id: 1,
      assetId: "",
      locationName: "",
      startDate: new Date().toISOString().split("T")[0],
      assigneeId: "",
      teamId: "",
    },
  ]);

  const handleAddAssetRow = () => {
    setAssetRows([
      ...assetRows,
      {
        id: Date.now(),
        assetId: "",
        locationName: "",
        startDate: new Date().toISOString().split("T")[0],
        assigneeId: "",
        teamId: "",
      },
    ]);
  };

  const removeAssetRow = (id: number) =>
    setAssetRows(assetRows.filter((r) => r.id !== id));

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, type: "Inspection" },
    ]);
    setNewTaskText("");
  };

  const removeTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.title) return alert("PM Title is required");
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        scheduleType: formData.scheduleType,
        firstDueDate: formData.firstDueDate || new Date().toISOString(),
        assigneeId: formData.assigneeId || null,
        teamId: formData.teamId || null,
        assetId: formData.assetId || null,
        taskData: tasks,
        partsData: selectedParts,
        organizationId: user.organizationId,
        creatorId: user.id,
      };

      const res = await fetch("http://${API_URL}/api/pm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) onCreated();
      else alert("Failed to create PM Master Schedule");
    } catch (err) {
      alert("Server Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all";
  const labelClass =
    "block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-[24px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Create Preventive Maintenance Trigger
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure work order templates, recurrence schedules, and asset
              mapping.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-colors shadow-sm border border-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex px-8 border-b border-gray-200 bg-gray-50/30 gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-4 text-sm font-extrabold border-b-2 transition-all ${activeTab === "details" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            1. Work Order Details & Checklists
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`py-4 text-sm font-extrabold border-b-2 transition-all ${activeTab === "schedule" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            2. Calendar & Recurrence Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`py-4 text-sm font-extrabold border-b-2 transition-all ${activeTab === "assets" ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            3. Assets & Locations Matrix
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto flex-1"
        >
          {activeTab === "details" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>PM Template Title *</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Monthly MX4D Inspection"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Generated Work Order Title
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    value={formData.workOrderTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workOrderTitle: e.target.value,
                      })
                    }
                    placeholder="e.g., Monthly Maintenance Routine"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Standard Description</label>
                <textarea
                  className={`${inputClass} min-h-[90px]`}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe safety checks and procedures..."
                />
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    className={inputClass}
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="WEEKLY_MONTHLY_CHECKLISTS">
                      Weekly/Monthly Checklists
                    </option>
                    <option value="ANNUAL_PREVENTIVE_MAINTENANCE">
                      Annual Preventive Maintenance
                    </option>
                    <option value="PROJECT_UPGRADE">Project Upgrade</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Estimated Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className={inputClass}
                    value={formData.durationHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationHours: e.target.value,
                      })
                    }
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                    Standard Operating Checklists & Tasks
                  </h3>
                  <span className="text-xs text-purple-600 font-bold">
                    {tasks.length} items configured
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-xl shadow-sm"
                    >
                      <div className="w-4 h-4 rounded border-2 border-purple-500 bg-purple-50"></div>
                      <span className="text-sm font-medium flex-1 text-gray-800">
                        {task.text}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-bold">
                        {task.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTask(task.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddTask())
                    }
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-600"
                    placeholder="Add checklist step..."
                  />
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                <h3 className="text-base font-extrabold text-purple-900 mb-1">
                  Calendar Recurrence Engine
                </h3>
                <p className="text-xs text-purple-700 mb-6">
                  Configure how often this preventive maintenance triggers new
                  work orders automatically.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Schedule Type</label>
                    <select
                      className={inputClass}
                      value={formData.scheduleType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduleType: e.target.value,
                        })
                      }
                    >
                      <option value="DAILY">Daily Interval</option>
                      <option value="WEEKLY">Weekly Interval</option>
                      <option value="MONTHLY">Monthly Interval</option>
                      <option value="QUARTERLY">Quarterly Interval</option>
                      <option value="YEARLY">Yearly / Annual Interval</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>First Due Date *</label>
                    <input
                      required
                      type="date"
                      className={inputClass}
                      value={formData.firstDueDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstDueDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assets" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Asset & Location Mapping Table
                  </h3>
                  <p className="text-xs text-gray-500">
                    Assign specific machinery and sites to this PM trigger.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAssetRow}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase">
                        Asset
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase">
                        Assigned To
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase">
                        Team
                      </th>
                      <th className="w-12 px-2 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {assetRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none"
                            value={row.assetId}
                            onChange={(e) => {
                              const updated = [...assetRows];
                              updated[idx].assetId = e.target.value;
                              setAssetRows(updated);
                            }}
                          >
                            <option value="">Select Asset...</option>
                            {orgAssets.map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none"
                            value={row.locationName}
                            onChange={(e) => {
                              const updated = [...assetRows];
                              updated[idx].locationName = e.target.value;
                              setAssetRows(updated);
                            }}
                          >
                            <option value="">Select Location...</option>
                            {orgLocations.map((l: any) => (
                              <option key={l.id} value={l.name}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="date"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none"
                            value={row.startDate}
                            onChange={(e) => {
                              const updated = [...assetRows];
                              updated[idx].startDate = e.target.value;
                              setAssetRows(updated);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none"
                            value={row.assigneeId}
                            onChange={(e) => {
                              const updated = [...assetRows];
                              updated[idx].assigneeId = e.target.value;
                              setAssetRows(updated);
                            }}
                          >
                            <option value="">Unassigned</option>
                            {orgUsers.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium outline-none"
                            value={row.teamId}
                            onChange={(e) => {
                              const updated = [...assetRows];
                              updated[idx].teamId = e.target.value;
                              setAssetRows(updated);
                            }}
                          >
                            <option value="">Unassigned Team</option>
                            {orgTeams.map((t: any) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {assetRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAssetRow(row.id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {activeTab !== "details" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "assets" ? "schedule" : "details",
                    )
                  }
                  className="px-6 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-all"
                >
                  Back
                </button>
              )}
              {activeTab !== "assets" ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "details" ? "schedule" : "assets",
                    )
                  }
                  className="px-8 py-3 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-md transition-all flex items-center gap-2"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating Trigger..." : "Create Master PM"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreventiveMaintenance;
