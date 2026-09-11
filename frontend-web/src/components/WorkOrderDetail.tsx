/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  FileText,
  UploadCloud,
  X,
  Trash2,
  Pencil,
  MessageSquare,
  AtSign,
} from "lucide-react";

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

const combineAndSortActivity = (logs: any[] = [], comments: any[] = []) => {
  const combined = [
    ...logs.map((log) => ({ ...log, type: "log" })),
    ...comments.map((comment) => ({ ...comment, type: "comment" })),
  ];
  return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const WorkOrderDetail = ({ user }: any) => {
  const { id } = useParams();
  const useNavigateHook = useNavigate();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = (path: string) => useNavigateHook(path);
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgAssets, setOrgAssets] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);
  const [orgTeams, setOrgTeams] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"DETAILS" | "TASKS" | "TIME" | "PARTS" | "FILES">(
    "DETAILS",
  );
  const [isActivityOpen, setIsActivityOpen] = useState(window.innerWidth >= 768);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");

  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const activityScrollRef = useRef<HTMLDivElement>(null);

  // --- MULTI-ASSIGNEE STATE & REFS ---
  const [selectedAssignees, setSelectedAssignees] = useState<any[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneesRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<{ id: number; text: string; completed: boolean }[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  const [parts, setParts] = useState<{ id: number; partId: string; name: string; qty: number }[]>(
    [],
  );
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  const [timeEntries, setTimeEntries] = useState<
    { id: number; worker: string; duration: number; date: string }[]
  >([]);
  const [newTimeDuration, setNewTimeDuration] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchWO = async () => {
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`);
      if (res.ok) setWo(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWO();
    if (user?.organizationId) {
      fetch(`${API_URL}/api/users/${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgUsers);
      fetch(`${API_URL}/api/assets?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgAssets);
      fetch(`${API_URL}/api/locations?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgLocations);
      fetch(`${API_URL}/api/inventory?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgParts);
      fetch(`${API_URL}/api/teams?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgTeams);
    }
  }, [id, user?.organizationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneesRef.current && !assigneesRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (wo && orgUsers.length > 0) {
      const assignees: any[] = [];
      if (wo.assignedTo) {
        const primary = orgUsers.find((u: any) => u.id === wo.assignedTo);
        if (primary) assignees.push(primary);
      }
      if (wo.additionalAssigneeEmails) {
        const emails = wo.additionalAssigneeEmails.split(",").map((e: string) => e.trim());
        emails.forEach((email: string) => {
          const matchedUser = orgUsers.find((u: any) => u.email === email);
          if (matchedUser && !assignees.some((a) => a.id === matchedUser.id)) {
            assignees.push(matchedUser);
          }
        });
      }
      setSelectedAssignees(assignees);
    }
  }, [wo, orgUsers]);

  const activities = useMemo(() => combineAndSortActivity(wo?.activityLogs, wo?.comments), [wo]);

  // Auto-scroll to the bottom of the activity list whenever it updates or opens
  useEffect(() => {
    if (isActivityOpen && activityScrollRef.current) {
      activityScrollRef.current.scrollTop = activityScrollRef.current.scrollHeight;
    }
  }, [activities, isActivityOpen]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    if (commentInputRef.current) {
      commentInputRef.current.style.height = "auto";
      commentInputRef.current.style.height = `${Math.min(commentInputRef.current.scrollHeight, 120)}px`;
    }

    const match = val.slice(0, e.target.selectionStart || 0).match(/(?:^|\s)@([^ \n]*)$/);
    if (match !== null) {
      setShowMentions(true);
      setMentionQuery(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const recordActivity = async (actionMsg: string) => {
    try {
      await fetch(`${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user.id, actionLog: actionMsg }),
      });
      fetchWO();
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  };

  const handleInlineUpdate = async (field: string, value: any, logMessage: string) => {
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]: value,
          actorId: user.id,
          actionLog: logMessage,
        }),
      });
      if (res.ok) fetchWO();
    } catch (err) {
      alert(`Failed to update ${field}`);
    }
  };

  const saveAssignees = async (newAssignees: any[], logMsg: string) => {
    const primary = newAssignees.length > 0 ? newAssignees[0].id : null;
    const additional =
      newAssignees.length > 1
        ? newAssignees
            .slice(1)
            .map((u) => u.email)
            .join(",")
        : null;

    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: primary,
          additionalAssigneeEmails: additional,
          actorId: user.id,
          actionLog: logMsg,
        }),
      });
      if (res.ok) fetchWO();
    } catch (err) {
      alert("Failed to update assignees");
    }
  };

  const addAssignee = (member: any) => {
    if (!selectedAssignees.some((a) => a.id === member.id)) {
      const updated = [...selectedAssignees, member];
      setSelectedAssignees(updated);
      saveAssignees(updated, `added assignee ${member.firstName} ${member.lastName}`);
    }
    setIsAssigneeDropdownOpen(false);
  };

  const removeAssignee = (member: any) => {
    const updated = selectedAssignees.filter((a) => a.id !== member.id);
    setSelectedAssignees(updated);
    saveAssignees(updated, `removed assignee ${member.firstName} ${member.lastName}`);
  };

  const selectMentionUser = (userObj: any) => {
    const lastAtIndex = newComment.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const updatedText =
        newComment.slice(0, lastAtIndex) + `@${userObj.firstName} ${userObj.lastName} `;
      setNewComment(updatedText);
    }
    setShowMentions(false);
    if (commentInputRef.current) commentInputRef.current.focus();
  };

  const startEditingHeader = () => {
    setHeaderTitle(wo.title);
    setHeaderDesc(wo.description || "");
    setIsEditingHeader(true);
  };

  const handleSaveHeader = async () => {
    await handleInlineUpdate("title", headerTitle, "updated work order title");
    await handleInlineUpdate("description", headerDesc, "updated work order description");
    setIsEditingHeader(false);
  };

  const handleDeleteWO = async () => {
    if (!window.confirm("Are you sure you want to completely delete this Work Order?")) return;
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, { method: "DELETE" });
      if (res.ok) navigate("/workspace/workorders");
    } catch (err) {
      alert("Error deleting work order");
    }
  };

  const handleStatusChange = async (status: string) => {
    await handleInlineUpdate("status", status, `changed status to ${status.replace("_", " ")}`);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment, authorId: user.id }),
      });
      if (res.ok) {
        setNewComment("");
        if (commentInputRef.current) commentInputRef.current.style.height = "auto";
        setShowMentions(false);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaderId", user.id);

    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await recordActivity(`uploaded a file: ${file.name}`);
      }
    } catch (error) {
      alert("An error occurred during upload");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    const taskTitle = newTaskText;
    setNewTaskText("");
    await recordActivity(`added a new task: "${taskTitle}"`);
  };

  const toggleTask = async (taskId: number, text: string, currentStatus: boolean) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    await recordActivity(`marked task "${text}" as ${!currentStatus ? "completed" : "incomplete"}`);
  };

  const removeTask = async (taskId: number, text: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    await recordActivity(`removed task: "${text}"`);
  };

  const handleAddPart = async () => {
    if (!selectedPartId) return;
    const partObj = orgParts.find((p) => p.id === selectedPartId);
    if (partObj) {
      setParts([
        ...parts,
        { id: Date.now(), partId: partObj.id, name: partObj.name, qty: selectedPartQty },
      ]);
      const addedQty = selectedPartQty;
      setSelectedPartId("");
      setSelectedPartQty(1);
      await recordActivity(`added part: ${partObj.name} (Qty: ${addedQty})`);
    }
  };

  const removePart = async (id: number, name: string) => {
    setParts(parts.filter((p) => p.id !== id));
    await recordActivity(`removed part: ${name}`);
  };

  const handleAddTime = async () => {
    if (!newTimeDuration) return;
    setTimeEntries([
      ...timeEntries,
      {
        id: Date.now(),
        worker: `${user.firstName} ${user.lastName}`,
        duration: parseFloat(newTimeDuration),
        date: new Date().toLocaleString(),
      },
    ]);
    const hours = newTimeDuration;
    setNewTimeDuration("");
    await recordActivity(`logged ${hours} hours of time`);
  };

  const filteredMentionUsers = orgUsers.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return fullName.includes(mentionQuery.toLowerCase());
  });

  const renderFormattedComment = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)?)/g);

    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const mentionName = part.substring(1).trim().toLowerCase();

        // Attempt to find the user in the orgUsers list
        const taggedUser = orgUsers.find(
          (u) =>
            `${u.firstName} ${u.lastName}`.toLowerCase() === mentionName ||
            u.firstName.toLowerCase() === mentionName,
        );

        if (taggedUser) {
          return (
            <button
              key={i}
              onClick={() => navigate(`/workspace/my-team/${taggedUser.id}`)}
              className="text-blue-600 bg-blue-50 font-black px-1.5 py-0.5 rounded-md inline-flex items-center my-0.5 border border-blue-100 shadow-2xs hover:bg-blue-100 transition-colors"
            >
              {part}
            </button>
          );
        }

        // Fallback if not an exact match but still formatted as a tag
        return (
          <span
            key={i}
            className="text-blue-600 bg-blue-50 font-black px-1.5 py-0.5 rounded-md inline-block my-0.5 border border-blue-100 shadow-2xs"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (loading)
    return (
      <div className="p-8 text-gray-500 flex items-center justify-center h-full">
        Loading ticket...
      </div>
    );
  if (!wo) return <div className="p-8 text-gray-500">Work Order not found</div>;

  const isCompleted = wo.status === "COMPLETE" || wo.status === "CLOSED";

  return (
    // Responsive dynamic height container
    <div className="flex flex-col h-full flex-1 bg-gray-50 font-sans overflow-hidden">
      {/* HEADER - Fixed at top */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/workspace/workorders")}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 text-base md:text-lg">WO-{wo.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={wo.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm cursor-pointer outline-none border transition-colors ${
              isCompleted
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <option value="OPEN">Open</option>
            <option value="COMPLETE">Complete</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* TOGGLE COMMENTS BUTTON (Mobile Only) */}
          <button
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className="md:hidden p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 relative flex items-center gap-1.5 font-bold text-xs shadow-sm hover:bg-blue-100 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {activities.length > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full absolute -top-1 -right-1 shadow-sm">
                {activities.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* CENTER CONTENT (Hidden on mobile when activity is open) */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200 transition-all ${isActivityOpen ? "hidden md:flex" : "flex"}`}
        >
          <div className="px-4 md:px-10 pt-6 md:pt-8 pb-4 md:pb-6 shrink-0 relative group">
            {isEditingHeader ? (
              <div className="space-y-4 max-w-4xl">
                <input
                  autoFocus
                  className="w-full text-xl md:text-2xl font-black text-gray-900 border border-blue-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 shadow-sm transition-all"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  placeholder="Work Order Title"
                />
                <textarea
                  className="w-full text-sm text-gray-800 border border-blue-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[100px] bg-gray-50 shadow-sm transition-all"
                  value={headerDesc}
                  onChange={(e) => setHeaderDesc(e.target.value)}
                  placeholder="Work Order Description"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveHeader}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="bg-gray-100 text-gray-600 px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start max-w-4xl">
                <div className="flex-1 pr-4">
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-2 leading-tight">
                    {wo.title}
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                    {wo.description || "No description provided."}
                  </p>
                </div>
                <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={startEditingHeader}
                    className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md transition-colors shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteWO}
                    className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-md transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 md:px-10 border-b border-gray-200 flex gap-6 md:gap-8 shrink-0 overflow-x-auto">
            {["DETAILS", "TASKS", "TIME", "PARTS", "FILES"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-xs md:text-sm font-bold tracking-wide transition-colors relative shrink-0 ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 bg-white pb-32 md:pb-8">
            {activeTab === "DETAILS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Details</h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                  <EditableRow label="LOCATION">
                    <select
                      value={wo.locationName || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "locationName",
                          e.target.value,
                          `changed location to ${e.target.options[e.target.selectedIndex].text}`,
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
                    >
                      <option value="">Select a location...</option>
                      {orgLocations.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </EditableRow>

                  <EditableRow label="ASSET">
                    <select
                      value={wo.assetId || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "assetId",
                          e.target.value || null,
                          `changed asset to ${e.target.options[e.target.selectedIndex].text}`,
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
                    >
                      <option value="">None</option>
                      {orgAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  </EditableRow>

                  {/* MULTI-SELECT ASSIGNEE COMPONENT */}
                  <EditableRow label="ASSIGNEES">
                    <div className="relative w-full" ref={assigneesRef}>
                      <div
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        className="w-full bg-transparent min-h-[32px] flex flex-wrap gap-1.5 items-center cursor-pointer outline-none"
                      >
                        {selectedAssignees.length > 0 ? (
                          selectedAssignees.map((assignee) => (
                            <span
                              key={assignee.id}
                              className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                              {assignee.firstName} {assignee.lastName}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAssignee(assignee);
                                }}
                                className="hover:text-red-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800">
                            Unassigned (Click to add)
                          </span>
                        )}
                      </div>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-50 py-2 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                          {orgUsers
                            .filter((u) => !selectedAssignees.some((a) => a.id === u.id))
                            .map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => addAssignee(u)}
                                className="w-full text-left px-4 py-2 text-xs md:text-sm font-medium hover:bg-blue-50 transition-colors"
                              >
                                {u.firstName} {u.lastName}
                              </button>
                            ))}
                          {orgUsers.filter((u) => !selectedAssignees.some((a) => a.id === u.id))
                            .length === 0 && (
                            <div className="px-4 py-2 text-xs text-gray-400 italic">
                              No additional users available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </EditableRow>

                  <EditableRow label="OPERATIONAL TEAM">
                    <select
                      value={wo.teamId || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "teamId",
                          e.target.value || null,
                          `changed operational team to ${e.target.options[e.target.selectedIndex].text}`,
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
                    >
                      <option value="">Unassigned</option>
                      {orgTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </EditableRow>

                  <EditableRow label="CATEGORY">
                    <select
                      value={wo.category || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "category",
                          e.target.value || null,
                          `changed category to ${e.target.value.replace(/_/g, " ")}`,
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-gray-900 cursor-pointer outline-none"
                    >
                      <option value="">None</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </EditableRow>

                  <EditableRow label="PRIORITY">
                    <select
                      value={wo.priority || "MEDIUM"}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "priority",
                          e.target.value,
                          `changed priority to ${e.target.value}`,
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-gray-900 cursor-pointer outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </EditableRow>

                  <EditableRow label="EST. DURATION">
                    <input
                      type="number"
                      step="0.5"
                      value={wo.estimatedHours || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "estimatedHours",
                          parseFloat(e.target.value) || null,
                          `changed estimated duration to ${e.target.value} hours`,
                        )
                      }
                      placeholder="0.0"
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-gray-900 outline-none"
                    />
                  </EditableRow>

                  <EditableRow label="DUE DATE">
                    <input
                      type="date"
                      value={wo.dueDate ? wo.dueDate.split("T")[0] : ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "dueDate",
                          e.target.value ? new Date(e.target.value).toISOString() : null,
                          "changed due date",
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-gray-900 outline-none cursor-pointer"
                    />
                  </EditableRow>
                </div>
              </div>
            )}

            {activeTab === "TASKS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Tasks</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    className="w-full sm:flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={handleAddTask}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id, task.text, task.completed)}
                          className="w-5 h-5 accent-blue-600"
                        />
                        <span
                          className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTask(task.id, task.text)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "PARTS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Parts</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="w-full sm:flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="">Select a part...</option>
                    {orgParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <input
                      type="number"
                      min="1"
                      value={selectedPartQty}
                      onChange={(e) => setSelectedPartQty(parseInt(e.target.value) || 1)}
                      className="w-20 sm:w-16 bg-white border border-gray-300 rounded-lg text-center text-sm py-2.5"
                    />
                    <button
                      onClick={handleAddPart}
                      className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                    >
                      <span className="text-sm font-bold">
                        {p.name} (Qty: {p.qty})
                      </span>
                      <button
                        onClick={() => removePart(p.id, p.name)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "TIME" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Time Log</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Hours"
                    value={newTimeDuration}
                    onChange={(e) => setNewTimeDuration(e.target.value)}
                    className="w-full sm:flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none"
                  />
                  <button
                    onClick={handleAddTime}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold active:scale-95 transition-all"
                  >
                    Log Time
                  </button>
                </div>
                <div className="space-y-3">
                  {timeEntries.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-xl"
                    >
                      <div>
                        <span className="text-sm font-bold">{t.worker}</span>
                        <span className="block text-xs text-gray-400">{t.date}</span>
                      </div>
                      <span className="text-sm font-black">{t.duration} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "FILES" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Files</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50 relative cursor-pointer mb-6">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-900">Upload attachment</p>
                </div>
                <div className="space-y-3">
                  {(wo.documents || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-xl"
                    >
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <a
                        href={`${API_URL}${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-blue-600 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: COMMENTS & ACTIVITY */}
        <div
          className={`flex flex-col bg-gray-50 shrink-0 border-l border-gray-200 transition-all duration-300 ease-in-out h-full overflow-hidden ${isActivityOpen ? "w-full md:w-[380px]" : "w-0 border-l-0"}`}
        >
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between h-14 w-full md:w-[380px]">
            <div className="flex items-center">
              <button
                onClick={() => setIsActivityOpen(false)}
                className="md:hidden p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-900 transition-colors mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black tracking-wide text-gray-900">
                Comments & Activity
              </h3>
            </div>
            <button
              onClick={() => setIsActivityOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Activity Scroll Area */}
          <div
            ref={activityScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 w-full md:w-[380px] bg-gray-50 pb-6"
          >
            {activities.length === 0 ? (
              <div className="text-center text-sm text-gray-400 italic mt-10">No activity yet.</div>
            ) : (
              activities.map((item: any, idx: number) => {
                const isSystemLog = item.type === "log";
                const authorId = item.actor?.id || item.author?.id;
                const authorName = item.actor?.firstName || item.author?.firstName || "System";
                const initial = authorName.charAt(0).toUpperCase();

                return (
                  <div key={`${item.type}-${item.id}-${idx}`} className="flex gap-3 group">
                    <button
                      onClick={() => authorId && navigate(`/workspace/my-team/${authorId}`)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm transition-transform active:scale-95 ${isSystemLog ? "bg-teal-600 cursor-default" : "bg-blue-600 cursor-pointer hover:opacity-90"}`}
                    >
                      {initial}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <button
                          onClick={() => authorId && navigate(`/workspace/my-team/${authorId}`)}
                          className="font-bold text-xs text-gray-900 hover:underline hover:text-blue-600"
                        >
                          {authorName}
                        </button>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed ${isSystemLog ? "text-gray-500 italic" : "text-gray-800 bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm"}`}
                      >
                        {isSystemLog ? item.action : renderFormattedComment(item.text)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* COMMENT INPUT & MENTIONS POPUP - FIXED AT BOTTOM */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0 w-full md:w-[380px] relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* TAGGING / MENTIONS DROPDOWN POPUP */}
            {showMentions && (
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Tag Teammate
                </div>
                {filteredMentionUsers.length > 0 ? (
                  filteredMentionUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectMentionUser(u)}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                        {u.firstName ? u.firstName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <span>
                        {u.firstName} {u.lastName}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-400 italic">
                    No users found matching "{mentionQuery}"
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end bg-gray-50 border border-gray-200 rounded-2xl shadow-inner overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600 transition-all">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
                placeholder="Write a message (type @ to tag)..."
                className="flex-1 bg-transparent py-3 px-4 text-xs md:text-sm outline-none resize-none max-h-32 min-h-[44px] custom-scrollbar"
                rows={1}
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="p-3 text-blue-600 disabled:text-gray-300 hover:bg-blue-100 transition-colors shrink-0 mb-0.5 mr-0.5 rounded-xl"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center py-3 px-4 md:px-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
    <div className="w-36 md:w-48 text-[11px] md:text-xs font-bold text-gray-400 tracking-wider shrink-0">
      {label}
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export default WorkOrderDetail;
