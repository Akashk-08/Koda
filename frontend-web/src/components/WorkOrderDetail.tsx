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
  Check,
  Sparkles,
  Activity as ActivityIcon,
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

const combineAndSortActivity = (logs: any, comments: any) => {
  const validLogs = Array.isArray(logs) ? logs : [];
  const validComments = Array.isArray(comments) ? comments : [];

  const combined = [
    ...validLogs.map((log) => ({ ...log, type: "log" })),
    ...validComments.map((comment) => ({ ...comment, type: "comment" })),
  ];

  return combined.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
};

const getAttachmentUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

const WorkOrderDetail = ({ user }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [isEditing, setIsEditing] = useState(false);

  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");

  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  // Comment Edit States
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const activityScrollRef = useRef<HTMLDivElement>(null);

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
      if (res.ok) {
        const data = await res.json();
        setWo(data);
        setHeaderTitle(data.title);
        setHeaderDesc(data.description || "");
      } else {
        setWo(null);
      }
    } catch (err) {
      console.error(err);
      setWo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWO();
    
    if (user?.organizationId) {
      fetch(`${API_URL}/api/users?orgId=${user.organizationId}`)
        .then(async (res) => res.ok ? await res.json() : [])
        .then((data) => setOrgUsers(Array.isArray(data) ? data : []))
        .catch(() => setOrgUsers([]));

      fetch(`${API_URL}/api/assets?orgId=${user.organizationId}`)
        .then(async (res) => res.ok ? await res.json() : [])
        .then((data) => setOrgAssets(Array.isArray(data) ? data : []))
        .catch(() => setOrgAssets([]));

      fetch(`${API_URL}/api/locations?orgId=${user.organizationId}`)
        .then(async (res) => res.ok ? await res.json() : [])
        .then((data) => setOrgLocations(Array.isArray(data) ? data : []))
        .catch(() => setOrgLocations([]));

      fetch(`${API_URL}/api/inventory?orgId=${user.organizationId}`)
        .then(async (res) => res.ok ? await res.json() : [])
        .then((data) => setOrgParts(Array.isArray(data) ? data : []))
        .catch(() => setOrgParts([]));

      fetch(`${API_URL}/api/teams?orgId=${user.organizationId}`)
        .then(async (res) => res.ok ? await res.json() : [])
        .then((data) => setOrgTeams(Array.isArray(data) ? data : []))
        .catch(() => setOrgTeams([]));
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

  useEffect(() => {
    if (activityScrollRef.current) {
      activityScrollRef.current.scrollTop = activityScrollRef.current.scrollHeight;
    }
  }, [activities]);

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

  const handleSaveAllEdits = async () => {
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: headerTitle,
          description: headerDesc,
          locationName: wo.locationName,
          assetId: wo.assetId || null,
          teamId: wo.teamId || null,
          category: wo.category || null,
          priority: wo.priority,
          estimatedHours: wo.estimatedHours ? parseFloat(wo.estimatedHours) : null,
          dueDate: wo.dueDate,
          actorId: user.id,
          actionLog: "updated work order details",
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to save changes");
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

  const handleDeleteWO = async () => {
    if (!window.confirm("Are you sure you want to completely delete this Work Order?")) return;
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, { method: "DELETE" });
      if (res.ok) navigate("/workspace/workorders");
    } catch (err) {
      alert("Error deleting work order");
    }
  };

  const handleStatusChangeOptimistic = async (newStatus: string) => {
    setIsStatusMenuOpen(false);
    if (wo.status === newStatus) return;

    const prevStatus = wo.status;
    setWo({ ...wo, status: newStatus });

    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actorId: user.id,
          actionLog: `changed status to ${newStatus.replace("_", " ")}`,
        }),
      });
      
      if (res.ok) {
        fetchWO();
      } else {
        throw new Error("Backend failed");
      }
    } catch (err) {
      setWo({ ...wo, status: prevStatus });
      alert("Failed to update status");
    }
  };

  const STATUS_UI: any = {
    OPEN: { 
      label: 'Open', 
      buttonClasses: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', 
      menuItemClasses: 'text-blue-700 bg-blue-50 hover:bg-blue-100', 
      dotClass: 'bg-blue-500',
      textClass: 'text-blue-500'
    },
    COMPLETE: { 
      label: 'Complete', 
      buttonClasses: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', 
      menuItemClasses: 'text-green-700 bg-green-50 hover:bg-green-100', 
      dotClass: 'bg-green-500',
      textClass: 'text-green-500'
    },
    CLOSED: { 
      label: 'Closed', 
      buttonClasses: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', 
      menuItemClasses: 'text-red-700 bg-red-50 hover:bg-red-100', 
      dotClass: 'bg-red-500',
      textClass: 'text-red-500'
    },
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

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText, actorId: user.id }),
      });
      if (res.ok) {
        setEditingCommentId(null);
        setEditText("");
        fetchWO();
      }
    } catch (err) {
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${API_URL}/api/workorders/${id}/comments/${commentId}?actorId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchWO();
      }
    } catch (err) {
      alert("Failed to delete comment");
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

  return (
    <div className="flex flex-col h-full flex-1 bg-gray-50 font-sans overflow-hidden">
      {/* HEADER */}
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

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Work Order
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAllEdits}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              className={`inline-flex items-center justify-between w-36 px-4 py-2.5 rounded-full font-bold text-xs md:text-sm border transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${STATUS_UI[wo.status]?.buttonClasses || STATUS_UI.OPEN.buttonClasses}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full shadow-sm ${STATUS_UI[wo.status]?.dotClass || STATUS_UI.OPEN.dotClass}`}></span>
                {STATUS_UI[wo.status]?.label || 'Open'}
              </div>
              <svg className={`w-4 h-4 ml-2 opacity-70 transition-transform duration-200 ${isStatusMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusMenuOpen && (
              <div className="absolute right-0 z-50 w-44 mt-2 origin-top-right bg-white border border-gray-100 rounded-2xl shadow-xl ring-1 ring-black/5 focus:outline-none p-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex flex-col gap-1">
                  {Object.keys(STATUS_UI).map((key) => {
                    const isSelected = wo.status === key;
                    const ui = STATUS_UI[key];
                    return (
                      <button
                        key={key}
                        onClick={() => handleStatusChangeOptimistic(key)}
                        className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-xl transition-all group ${isSelected ? ui.menuItemClasses + ' font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full transition-colors ${isSelected ? ui.dotClass : 'bg-transparent border border-gray-300 group-hover:border-gray-400'}`}></span>
                          {ui.label}
                        </div>
                        {isSelected && (
                          <Check className={`w-4 h-4 ${ui.textClass}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200">
          <div className="px-4 md:px-10 pt-6 md:pt-8 pb-4 md:pb-6 shrink-0 relative group">
            {isEditing ? (
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
                <button
                  onClick={handleDeleteWO}
                  className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-md transition-colors shadow-sm"
                  title="Delete Work Order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">Details</h3>
                  {!isEditing && (
                    <span className="text-xs font-semibold text-gray-400 italic">
                      Click "Edit Work Order" above to modify details.
                    </span>
                  )}
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                  
                  <EditableRow label="LOCATION">
                    {isEditing ? (
                      <select
                        value={wo.locationName || wo.location || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, locationName: val });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      >
                        <option value="">Select a location...</option>
                        {orgLocations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {wo.locationName || wo.location || "Unspecified"}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="ASSET">
                    {isEditing ? (
                      <select
                        value={wo.assetId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, assetId: val || null });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      >
                        <option value="">None</option>
                        {orgAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {orgAssets.find(a => a.id === wo.assetId)?.name || "None"}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="ASSIGNEES">
                    <div className="relative w-full" ref={assigneesRef}>
                      <div
                        onClick={() => {
                          if (isEditing) setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                        }}
                        className={`w-full bg-transparent min-h-[32px] flex flex-wrap gap-1.5 items-center ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                      >
                        {selectedAssignees.length > 0 ? (
                          selectedAssignees.map((assignee) => (
                            <span
                              key={assignee.id}
                              className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm"
                            >
                              {assignee.firstName} {assignee.lastName}
                              {isEditing && (
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
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs md:text-sm font-medium text-gray-400 italic">
                            Unassigned
                          </span>
                        )}
                      </div>

                      {isEditing && isAssigneeDropdownOpen && (
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
                        </div>
                      )}
                    </div>
                  </EditableRow>

                  <EditableRow label="OPERATIONAL TEAM">
                    {isEditing ? (
                      <select
                        value={wo.teamId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, teamId: val || null });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      >
                        <option value="">Unassigned</option>
                        {orgTeams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {orgTeams.find(t => t.id === wo.teamId)?.name || "Unassigned"}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="CATEGORY">
                    {isEditing ? (
                      <select
                        value={wo.category || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, category: val || null });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      >
                        <option value="">None</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {wo.category ? wo.category.replace(/_/g, " ") : "None"}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="PRIORITY">
                    {isEditing ? (
                      <select
                        value={wo.priority || "MEDIUM"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, priority: val });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800 uppercase">
                        {wo.priority}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="EST. DURATION">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={wo.estimatedHours || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, estimatedHours: val });
                        }}
                        placeholder="0.0"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none"
                      />
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {wo.estimatedHours ? `${wo.estimatedHours} hrs` : "0.0 hrs"}
                      </span>
                    )}
                  </EditableRow>

                  <EditableRow label="DUE DATE">
                    {isEditing ? (
                      <input
                        type="date"
                        value={wo.dueDate ? wo.dueDate.split("T")[0] : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWo({ ...wo, dueDate: val ? new Date(val).toISOString() : null });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs md:text-sm font-medium text-gray-900 outline-none cursor-pointer"
                      />
                    ) : (
                      <span className="text-xs md:text-sm font-medium text-gray-800">
                        {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : "No due date"}
                      </span>
                    )}
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
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-xl shadow-2xs"
                    >
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <a
                        href={getAttachmentUrl(doc.fileUrl)}
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

        {/* RIGHT SIDEBAR: MODERNIZED COMMENTS & ACTIVITY STREAM */}
        <div className="flex flex-col bg-[#F8FAFC] shrink-0 border-l border-gray-200/80 w-full md:w-[400px] h-full overflow-hidden shadow-sm">
          {/* Stream Header */}
          <div className="px-5 py-4 border-b border-gray-200/80 bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-between h-16 w-full md:w-[400px]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Activity Stream
                </h3>
                <p className="text-[10px] font-medium text-gray-400">
                  Real-time updates & comments
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60">
              {activities.length} items
            </span>
          </div>

          {/* Activity Scroll Body */}
          <div
            ref={activityScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 w-full md:w-[400px] pb-6 custom-scrollbar"
          >
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto mb-3 shadow-2xs text-gray-300">
                  <ActivityIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-700">No activity recorded yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Start the conversation or make updates below.
                </p>
              </div>
            ) : (
              activities.map((item: any, idx: number) => {
                const isSystemLog = item.type === "log";
                const authorId = item.actor?.id || item.author?.id;
                const authorName = item.actor?.firstName || item.author?.firstName || "System";
                const initial = authorName.charAt(0).toUpperCase();
                const isMyComment = !isSystemLog && authorId === user.id;
                const isEditingThisComment = editingCommentId === item.id;

                return (
                  <div key={`${item.type}-${item.id}-${idx}`} className="flex gap-3 group animate-in fade-in duration-200">
                    <button
                      onClick={() => authorId && navigate(`/workspace/my-team/${authorId}`)}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-black text-xs shrink-0 mt-0.5 shadow-sm transition-transform active:scale-95 ${
                        isSystemLog
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600 cursor-default ring-2 ring-teal-500/10"
                          : "bg-gradient-to-br from-blue-600 to-indigo-600 cursor-pointer hover:opacity-90 ring-2 ring-blue-600/10"
                      }`}
                    >
                      {initial}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <button
                          onClick={() => authorId && navigate(`/workspace/my-team/${authorId}`)}
                          className="font-bold text-xs text-gray-900 hover:underline hover:text-blue-600 tracking-tight"
                        >
                          {authorName}
                        </button>
                        <div className="flex items-center gap-2">
                          {isMyComment && !isSystemLog && !isEditingThisComment && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] font-bold">
                              <button
                                onClick={() => {
                                  setEditingCommentId(item.id);
                                  setEditText(item.text);
                                }}
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-gray-300">•</span>
                              <button
                                onClick={() => handleDeleteComment(item.id)}
                                className="text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {isEditingThisComment ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-white border border-blue-300 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateComment(item.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-2xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed ${
                            isSystemLog
                              ? "text-gray-500 italic bg-gray-100/70 border border-gray-200/60 px-3.5 py-2 rounded-xl text-[11px] shadow-2xs"
                              : "text-gray-800 bg-white border border-gray-200/80 px-4 py-3 rounded-2xl rounded-tl-sm shadow-2xs"
                          }`}
                        >
                          {isSystemLog ? item.action : renderFormattedComment(item.text)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modernized Chat Input Box */}
          <div className="p-3.5 bg-white border-t border-gray-200/80 shrink-0 w-full md:w-[400px] relative shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.03)]">
            {showMentions && (
              <div className="absolute bottom-full left-3.5 right-3.5 mb-2.5 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden z-50 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-600" /> Tag Teammate
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

            <div className="flex items-end bg-[#F8FAFC] border border-gray-200 rounded-2xl shadow-inner overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
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
                className="flex-1 bg-transparent py-3 px-4 text-xs md:text-sm outline-none resize-none max-h-32 min-h-[44px] custom-scrollbar text-gray-800 placeholder-gray-400 font-medium"
                rows={1}
              />
              <button
                onClick={handlePostComment}
                disabled={!newComment.trim()}
                className="p-2.5 bg-blue-600 text-white disabled:bg-gray-200 disabled:text-gray-400 hover:bg-blue-700 transition-colors shrink-0 mb-1.5 mr-1.5 rounded-xl shadow-sm active:scale-95"
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
  <div className="flex items-center py-3.5 px-4 md:px-6 hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-0">
    <div className="w-36 md:w-48 text-[11px] md:text-xs font-bold text-gray-400 tracking-wider shrink-0">
      {label}
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export default WorkOrderDetail;