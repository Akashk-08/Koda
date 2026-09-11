/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  UploadCloud,
  FileText,
  X,
  Search,
  Link as LinkIcon,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Box,
  Wrench,
  Settings,
  Users,
  AlertCircle,
} from "lucide-react";

// Admin / Full Access Categories
const FULL_CATEGORIES = [
  { label: "None", value: "NONE" },
  { label: "Annual PM", value: "ANNUAL_PREVENTIVE_MAINTENANCE" },
  { label: "Assets", value: "ASSETS" },
  { label: "Large Damage", value: "LARGE_DAMAGE" },
  { label: "Part Request", value: "PARTS_REQUEST" },
  { label: "Project/Upgrade", value: "PROJECT_UPGRADE" },
  { label: "Six months PM", value: "SIX_MONTH_PREVENTIVE_MAINTENANCE" },
  { label: "Support Req", value: "SUPPORT_REQUEST" },
  { label: "Weekly/monthly/checklists", value: "WEEKLY_MONTHLY_CHECKLISTS" },
];

// Restricted / Site User Categories
const RESTRICTED_CATEGORIES = [
  { label: "Part Request", value: "PARTS_REQUEST" },
  { label: "Technical Support Request", value: "SUPPORT_REQUEST" },
];

const SectionHeader = ({ title, icon: Icon }: any) => (
  <div className="flex items-center space-x-2 text-gray-800 border-b border-gray-100 pb-2 mb-4 mt-8 first:mt-0">
    <Icon className="w-5 h-5 text-blue-600" />
    <h3 className="text-sm font-extrabold uppercase tracking-wider">{title}</h3>
  </div>
);

const API_URL = import.meta.env.VITE_API_URL;

const CreateWorkOrderModal = ({ isOpen, onClose, user, onCreated, preSelectedAsset }: any) => {
  const isFullAccess =
    user?.role === "ADMIN" ||
    user?.siteLocation === "Pulseworks Shop" ||
    user?.siteLocation === "Pulseworks Warehouse";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");

  const [customRequestSubject, setCustomRequestSubject] = useState("");
  const [siteLocation, setSiteLocation] = useState(user?.siteLocation || "");
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState("");

  const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [selectedParts, setSelectedParts] = useState<
    { partId: string; quantity: number; name: string }[]
  >([]);
  const [partSearch, setPartSearch] = useState("");

  // Start with an EMPTY array for tasks
  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedParentWo, setSelectedParentWo] = useState<any | null>(null);
  const [parentSearchTerm, setParentSearchTerm] = useState("");

  const [locationSearch, setLocationSearch] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [isPartsDropdownOpen, setIsPartsDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [existingWorkOrders, setExistingWorkOrders] = useState<any[]>([]);
  const [orgAssets, setOrgAssets] = useState<any[]>([]);
  const [orgTeams, setOrgTeams] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);

  const assigneesRef = useRef<HTMLDivElement>(null);
  const parentWoRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (preSelectedAsset) setSelectedAssetId(preSelectedAsset.id);
      if (!isFullAccess) {
        setStartDate(new Date().toISOString().slice(0, 16));
        setSiteLocation(user?.siteLocation || "");
      }
    }
  }, [isOpen, preSelectedAsset, isFullAccess, user]);

  // Auto-generate title using shortName for Restricted Users
  useEffect(() => {
    if (!isFullAccess && category) {
      const locationObj = orgLocations.find((l) => l.name?.trim() === siteLocation?.trim());
      let shortLoc = locationObj?.shortName?.trim();

      if (!shortLoc && siteLocation) {
        shortLoc = siteLocation.split("-")[0].trim();
      } else if (!shortLoc) {
        shortLoc = "Unknown Site";
      }

      if (category === "PARTS_REQUEST") {
        setTitle(`Parts Request - ${shortLoc} - ${customRequestSubject}`);
      } else if (category === "SUPPORT_REQUEST") {
        setTitle(`TSR - ${shortLoc} - ${customRequestSubject}`);
      }
    }
  }, [category, siteLocation, customRequestSubject, isFullAccess, orgLocations]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !user.organizationId) return;
      try {
        const [usersRes, woRes] = await Promise.all([
          fetch(`${API_URL}/api/users?orgId=${user.organizationId}`),
          fetch(`${API_URL}/api/workorders?orgId=${user.organizationId}`),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setOrgUsers(
            Array.isArray(usersData)
              ? usersData.filter((u: any) => u.approvalStatus !== "PENDING")
              : [],
          );
        }
        if (woRes.ok) {
          const woData = await woRes.json();
          setExistingWorkOrders(Array.isArray(woData) ? woData : woData.data || []);
        }

        try {
          const assetsRes = await fetch(
            `${API_URL}/api/assets?orgId=${user.organizationId}`,
          );
          if (assetsRes.ok) setOrgAssets(await assetsRes.json());

          const teamsRes = await fetch(`${API_URL}/api/teams?orgId=${user.organizationId}`);
          if (teamsRes.ok) setOrgTeams(await teamsRes.json());

          const partsRes = await fetch(
            `${API_URL}/api/inventory?orgId=${user.organizationId}`,
          );
          if (partsRes.ok) setOrgParts(await partsRes.json());

          const locRes = await fetch(
            `${API_URL}/api/locations?orgId=${user.organizationId}`,
          );
          if (locRes.ok) setOrgLocations(await locRes.json());
        } catch (e) {
          console.warn("Some related endpoints might not be ready yet.");
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [isOpen, user.organizationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneesRef.current && !assigneesRef.current.contains(event.target as Node))
        setIsTeamDropdownOpen(false);
      if (parentWoRef.current && !parentWoRef.current.contains(event.target as Node))
        setIsParentDropdownOpen(false);
      if (partsRef.current && !partsRef.current.contains(event.target as Node))
        setIsPartsDropdownOpen(false);
      if (locationRef.current && !locationRef.current.contains(event.target as Node))
        setIsLocationDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!category) return alert("Please select a category first.");
    if (!title.trim() && isFullAccess) return alert("Title is required!");
    if (!customRequestSubject.trim() && !isFullAccess)
      return alert("Please specify the subject/issue of your request.");

    // MANDATORY TEAM VALIDATION
    if (!selectedTeamId) return alert("Please select an Operational Team.");

    setIsSubmitting(true);

    try {
      const additionalEmails =
        selectedAssignees.length > 1
          ? selectedAssignees
              .slice(1)
              .map((u) => u.email)
              .join(",")
          : null;

      const payload = {
        title: isFullAccess ? title : title.trim(),
        description,
        category: category && category !== "None" ? category : null,
        priority,
        organizationId: user.organizationId,
        createdBy: user.id,
        assignedTo: selectedAssignees.length > 0 ? selectedAssignees[0].id : null,
        additionalAssigneeEmails: additionalEmails,
        teamId: selectedTeamId || null,
        assetId: selectedAssetId || null,
        siteLocation,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        durationHours: duration ? parseFloat(duration) : null,
        parentWorkOrderId: selectedParentWo ? selectedParentWo.id : null,
        parts: selectedParts,
        tasks,
      };

      const response = await fetch(`${API_URL}/api/workorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newWo = await response.json();

        if (attachedFiles.length > 0) {
          for (const file of attachedFiles) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("uploaderId", user.id);
            await fetch(`${API_URL}/api/workorders/${newWo.id}/documents`, {
              method: "POST",
              body: formData,
            });
          }
        }

        // Reset form
        setTitle("");
        setCustomRequestSubject("");
        setDescription("");
        setCategory("");
        setPriority("MEDIUM");
        setSiteLocation(user?.siteLocation || "");
        setLocationSearch("");
        setSelectedAssetId("");
        setStartDate("");
        setDueDate("");
        setDuration("");
        setSelectedAssignees([]);
        setSelectedTeamId("");
        setSelectedParts([]);
        setAttachedFiles([]);
        setTasks([]); // Tasks correctly reset to empty
        setSelectedParentWo(null);

        onCreated();
        onClose();
      } else {
        alert("Failed to create work order.");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAssignee = (member: any) => {
    if (!selectedAssignees.some((a) => a.id === member.id))
      setSelectedAssignees([...selectedAssignees, member]);
    setIsTeamDropdownOpen(false);
  };
  const removeAssignee = (id: string) =>
    setSelectedAssignees(selectedAssignees.filter((a) => a.id !== id));

  const addPart = (part: any) => {
    if (!selectedParts.some((p) => p.partId === part.id)) {
      setSelectedParts([...selectedParts, { partId: part.id, name: part.name, quantity: 1 }]);
    }
    setIsPartsDropdownOpen(false);
    setPartSearch("");
  };
  const updatePartQty = (partId: string, qty: number) => {
    setSelectedParts(selectedParts.map((p) => (p.partId === partId ? { ...p, quantity: qty } : p)));
  };
  const removePart = (partId: string) =>
    setSelectedParts(selectedParts.filter((p) => p.partId !== partId));

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText("");
  };
  const toggleTask = (id: number) =>
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const removeTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files)
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files as ArrayLike<File>)]);
  };
  const removeFile = (index: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));

  const filteredParentWorkOrders = Array.isArray(existingWorkOrders)
    ? existingWorkOrders.filter(
        (wo) =>
          wo.title?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
          String(wo.id).includes(parentSearchTerm),
      )
    : [];

  const filteredParts = Array.isArray(orgParts)
    ? orgParts.filter((p) => p.name?.toLowerCase().includes(partSearch.toLowerCase()))
    : [];

  const filteredLocations = Array.isArray(orgLocations)
    ? orgLocations.filter((loc) => loc.name?.toLowerCase().includes(locationSearch.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-md md:p-4 animate-in fade-in duration-200">
      <div className="bg-gray-50 text-gray-900 w-full max-w-4xl rounded-t-[32px] md:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">
              Create New Work Order.
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {isFullAccess
                ? "Fill out the details below to open a new maintenance ticket."
                : "Select your request type to begin."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            {/* 1. CATEGORY SELECTION (ALWAYS VISIBLE) */}
            <SectionHeader title="Request Type" icon={FileText} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-blue-50 border border-blue-200 text-blue-900 rounded-xl px-4 py-3 text-sm font-extrabold outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer transition-all"
              >
                <option value="">Select category...</option>
                {isFullAccess
                  ? FULL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))
                  : RESTRICTED_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
              </select>
            </div>

            {/* ONLY SHOW REST OF FORM IF CATEGORY IS SELECTED OR USER HAS FULL ACCESS */}
            {(category || isFullAccess) && (
              <>
                {/* DYNAMIC TITLE FIELD */}
                {isFullAccess ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Work Order Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., TSR - Site Name - Issue / Part"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      {category === "PARTS_REQUEST"
                        ? "What parts do you need?"
                        : "What is the issue?"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customRequestSubject}
                      onChange={(e) => setCustomRequestSubject(e.target.value)}
                      placeholder={
                        category === "PARTS_REQUEST"
                          ? "e.g., Replacement HDMI Cable"
                          : "e.g., Headset not tracking"
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                    {customRequestSubject && (
                      <p className="text-[10px] text-gray-400 mt-2 font-mono">
                        Auto-generated Title: {title}
                      </p>
                    )}
                  </div>
                )}

                {/* PRIORITY & DESCRIPTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={!isFullAccess ? "hidden" : ""}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Description & Details
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide additional context or instructions..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all resize-y"
                  />
                </div>

                {/* 2. JOB SPECIFICATION */}
                <SectionHeader title="Job Specification" icon={Settings} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative" ref={locationRef}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Site Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        disabled={!isFullAccess}
                        placeholder="Search or select a location..."
                        value={isLocationDropdownOpen ? locationSearch : siteLocation}
                        onFocus={() => {
                          if (!isFullAccess) return;
                          setIsLocationDropdownOpen(true);
                          setLocationSearch("");
                        }}
                        onChange={(e) => {
                          setLocationSearch(e.target.value);
                          setIsLocationDropdownOpen(true);
                        }}
                        className={`w-full border rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none transition-all ${
                          !isFullAccess
                            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                        }`}
                      />
                      {isLocationDropdownOpen && isFullAccess && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-2 max-h-48 overflow-y-auto">
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => {
                                  setSiteLocation(loc.name);
                                  setIsLocationDropdownOpen(false);
                                  setLocationSearch("");
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors"
                              >
                                {loc.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 italic">
                              No locations found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Target Asset (Optional)
                    </label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      disabled={!!preSelectedAsset}
                      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all ${
                        preSelectedAsset
                          ? "bg-gray-100 cursor-not-allowed opacity-70 text-gray-600"
                          : "bg-gray-50 focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                      }`}
                    >
                      <option value="">No specific asset</option>
                      {orgAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                      {preSelectedAsset && !orgAssets.some((a) => a.id === preSelectedAsset.id) && (
                        <option value={preSelectedAsset.id}>{preSelectedAsset.name}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 3. SCHEDULE */}
                {isFullAccess && (
                  <>
                    <SectionHeader title="Schedule" icon={Calendar} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                          Duration (Hours)
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="0.0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 4. ASSIGNMENT (Visible to all, but restricted for non-admins) */}
                <SectionHeader title="Assignment" icon={Users} />
                <div
                  className={`grid grid-cols-1 gap-5 ${isFullAccess ? "md:grid-cols-3" : "md:grid-cols-2"}`}
                >
                  {/* AUTHOR (Visible to all) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Author
                    </label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed flex items-center">
                      <User className="w-4 h-4 mr-2" /> {user?.firstName} {user?.lastName}
                    </div>
                  </div>

                  {/* OPERATIONAL TEAM (Visible to all) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Operational Team <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer transition-all"
                    >
                      <option value="">Select team...</option>
                      <option value="NONE">None</option>
                      {orgTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ASSIGNEES MULTI-SELECT (Visible ONLY to Admins/Full Access) */}
                  {isFullAccess && (
                    <div className="relative" ref={assigneesRef}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                        Assignees
                      </label>
                      <div
                        onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-h-[46px] flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-600 transition-all"
                      >
                        {selectedAssignees.map((assignee) => (
                          <span
                            key={assignee.id}
                            className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                          >
                            {assignee.firstName} {assignee.lastName}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAssignee(assignee.id);
                              }}
                              className="hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {selectedAssignees.length === 0 && (
                          <span className="text-sm text-gray-400 px-1 select-none">
                            Select members...
                          </span>
                        )}
                      </div>

                      {isTeamDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-2 max-h-48 overflow-y-auto">
                          {orgUsers
                            .filter((u) => !selectedAssignees.some((a) => a.id === u.id))
                            .filter((u) => {
                              let isMatch = true;
                              if (siteLocation)
                                isMatch =
                                  isMatch &&
                                  u.siteLocation
                                    ?.toLowerCase()
                                    .includes(siteLocation.toLowerCase());
                              if (selectedTeamId) {
                                const matchesTeamId = u.teamId === selectedTeamId;
                                const selectedTeamObj = orgTeams.find(
                                  (t) => t.id === selectedTeamId,
                                );
                                const matchesTeamNameInLoc =
                                  selectedTeamObj?.name &&
                                  u.siteLocation
                                    ?.toLowerCase()
                                    .includes(selectedTeamObj.name.toLowerCase());
                                isMatch = isMatch && (matchesTeamId || matchesTeamNameInLoc);
                              }
                              return isMatch;
                            })
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => addAssignee(u)}
                                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors"
                              >
                                {u.firstName} {u.lastName}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. PARTS & INVENTORY */}
                {(!isFullAccess && category === "PARTS_REQUEST") || isFullAccess ? (
                  <>
                    <SectionHeader title="Inventory & Parts" icon={Box} />
                    <div
                      className={`border rounded-xl p-4 ${!isFullAccess ? "bg-blue-50/50 border-blue-200 shadow-sm" : "bg-gray-50 border-gray-200"}`}
                    >
                      {!isFullAccess && (
                        <div className="flex items-center gap-2 mb-4 text-blue-800 bg-blue-100 p-3 rounded-lg text-sm font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Please search and add the parts you need requested.
                        </div>
                      )}
                      <div className="relative mb-3" ref={partsRef}>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search and add parts required for this job..."
                            value={partSearch}
                            onFocus={() => setIsPartsDropdownOpen(true)}
                            onChange={(e) => {
                              setPartSearch(e.target.value);
                              setIsPartsDropdownOpen(true);
                            }}
                            className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        {isPartsDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-2 max-h-48 overflow-y-auto">
                            {filteredParts.length > 0 ? (
                              filteredParts.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => addPart(p)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-blue-50"
                                >
                                  {p.name}{" "}
                                  <span className="text-gray-400 ml-2">({p.sku || "No SKU"})</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-400 italic">
                                No parts found matching search
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {selectedParts.length > 0 ? (
                        <div className="space-y-2">
                          {selectedParts.map((part) => (
                            <div
                              key={part.partId}
                              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2.5 text-sm"
                            >
                              <span className="font-bold text-gray-800">{part.name}</span>
                              <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-gray-500">Qty:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={part.quantity}
                                  onChange={(e) =>
                                    updatePartQty(part.partId, parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 border border-gray-300 rounded-md px-2 py-1 outline-none focus:border-blue-500 text-center bg-gray-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePart(part.partId)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-400 italic border-2 border-dashed border-gray-200 rounded-lg bg-white">
                          No parts added yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : null}

                {/* 6. TASKS & ATTACHMENTS */}
                <SectionHeader title="Tasks & Attachments" icon={Wrench} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      {isFullAccess ? "Checklist" : "Troubleshooting Steps Taken"}
                    </label>
                    <div className="space-y-2.5">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center space-x-3 bg-gray-50 p-2.5 border border-gray-200 rounded-xl"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                          />
                          <span
                            className={`text-sm font-medium flex-1 ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
                          >
                            {task.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTask(task.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex space-x-2 mt-3">
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                          className="border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 flex-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                          placeholder={isFullAccess ? "New task..." : "e.g. Rebooted the computer"}
                        />
                        <button
                          type="button"
                          onClick={handleAddTask}
                          className="bg-gray-100 hover:bg-gray-200 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                      Photos / Files
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50/50 hover:bg-gray-100 transition-colors relative cursor-pointer group">
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                      />
                      <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-gray-800">Click to upload files</p>
                    </div>
                    {attachedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs"
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-gray-800 truncate">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent Linking */}
                <div className="border-t border-gray-100 pt-6 mt-6" ref={parentWoRef}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Link to Parent Work Order (Optional)
                  </label>
                  {selectedParentWo ? (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                      <div className="flex items-center space-x-2.5">
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-900">
                          WO-{selectedParentWo.id}: {selectedParentWo.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedParentWo(null)}
                        className="text-blue-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search existing work orders..."
                        value={parentSearchTerm}
                        onFocus={() => setIsParentDropdownOpen(true)}
                        onChange={(e) => {
                          setParentSearchTerm(e.target.value);
                          setIsParentDropdownOpen(true);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      {isParentDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20 py-2 max-h-48 overflow-y-auto">
                          {filteredParentWorkOrders.length > 0 ? (
                            filteredParentWorkOrders.map((wo) => (
                              <button
                                key={wo.id}
                                type="button"
                                onClick={() => {
                                  setSelectedParentWo(wo);
                                  setIsParentDropdownOpen(false);
                                  setParentSearchTerm("");
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex justify-between border-b border-gray-50 last:border-0"
                              >
                                <span className="font-semibold text-gray-800">
                                  WO-{wo.id}: {wo.title}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 italic">
                              No matching work orders
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 md:px-8 py-5 bg-white border-t border-gray-200 gap-3 pb-8 md:pb-5">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !category || !selectedTeamId}
            className="px-8 py-3 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Work Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkOrderModal;
