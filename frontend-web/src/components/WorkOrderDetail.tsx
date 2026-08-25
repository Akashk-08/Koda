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
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgAssets, setOrgAssets] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"DETAILS" | "TASKS" | "TIME" | "PARTS" | "FILES">(
    "DETAILS",
  );

  // Default sidebar closed on mobile so details show up first!
  const [isActivityOpen, setIsActivityOpen] = useState(window.innerWidth >= 768);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");

  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

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
      const res = await fetch(`http://${API_URL}/api/workorders/${id}`);
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
      fetch(`http://${API_URL}/api/users/${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgUsers);
      fetch(`http://${API_URL}/api/assets?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgAssets);
      fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgLocations);
      fetch(`http://${API_URL}/api/inventory?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgParts);
    }
  }, [id, user?.organizationId]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/(?:^|\s)@([^ \n]*)$/);

    if (match !== null) {
      setShowMentions(true);
      setMentionQuery(match[1]);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionedUser: any) => {
    if (!commentInputRef.current) return;
    const cursorPosition = commentInputRef.current.selectionStart || 0;
    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const textAfterCursor = newComment.slice(cursorPosition);
    const newTextBefore = textBeforeCursor.replace(
      /(?:^|\s)@([^ \n]*)$/,
      ` @${mentionedUser.firstName} ${mentionedUser.lastName} `,
    );

    setNewComment(newTextBefore + textAfterCursor);
    setShowMentions(false);
    commentInputRef.current.focus();
  };

  const filteredMentions = orgUsers.filter((u) =>
    (u.firstName + " " + u.lastName).toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const startEditingHeader = () => {
    setHeaderTitle(wo.title);
    setHeaderDesc(wo.description || "");
    setIsEditingHeader(true);
  };

  const handleSaveHeader = async () => {
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: headerTitle,
          description: headerDesc,
          actorId: user.id,
          actionLog: "Updated work order title and description",
        }),
      });
      if (res.ok) {
        setIsEditingHeader(false);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to update work order");
    }
  };

  const handleDeleteWO = async () => {
    if (
      !window.confirm(
        "Are you sure you want to completely delete this Work Order? This action cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        navigate("/workspace/workorders");
      } else {
        alert("Failed to delete work order");
      }
    } catch (err) {
      alert("Error deleting work order");
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await fetch(`http://${API_URL}/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          actorId: user.id,
          actionLog: `Updated status to ${status.replace("_", " ")}`,
        }),
      });
      fetchWO();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleInlineUpdate = async (field: string, value: any, logMessage: string) => {
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}`, {
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

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment, authorId: user.id }),
      });
      if (res.ok) {
        setNewComment("");
        setShowMentions(false);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editCommentText }),
      });
      if (res.ok) {
        setEditingCommentId(null);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`http://${API_URL}/api/workorders/${id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchWO();
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
      const res = await fetch(`http://${API_URL}/api/workorders/${id}/documents`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) fetchWO();
    } catch (error) {
      alert("An error occurred during upload");
    }
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText("");
  };
  const toggleTask = (taskId: number) =>
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  const removeTask = (taskId: number) => setTasks(tasks.filter((t) => t.id !== taskId));

  const handleAddPart = () => {
    if (!selectedPartId) return;
    const partObj = orgParts.find((p) => p.id === selectedPartId);
    if (partObj) {
      setParts([
        ...parts,
        {
          id: Date.now(),
          partId: partObj.id,
          name: partObj.name,
          qty: selectedPartQty,
        },
      ]);
      setSelectedPartId("");
      setSelectedPartQty(1);
    }
  };
  const removePart = (id: number) => setParts(parts.filter((p) => p.id !== id));

  const handleAddTime = () => {
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
    setNewTimeDuration("");
  };
  const removeTime = (id: number) => setTimeEntries(timeEntries.filter((t) => t.id !== id));

  const activities = useMemo(() => combineAndSortActivity(wo?.activityLogs, wo?.comments), [wo]);

  if (loading)
    return (
      <div className="p-8 text-gray-500 flex items-center justify-center h-full">
        Loading ticket...
      </div>
    );
  if (!wo) return <div className="p-8 text-gray-500">Work Order not found</div>;

  const isCompleted = wo.status === "COMPLETE" || wo.status === "CLOSED";

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden pb-20 md:pb-0 relative z-0">
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

          {/* TOGGLE COMMENTS BUTTON */}
          <button
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 relative flex items-center gap-1.5 font-bold text-xs shadow-sm hover:bg-blue-100 transition-colors"
            title="Toggle Comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comments</span>
            {activities.length > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {activities.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* CENTER CONTENT */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200 transition-all`}
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
                    title="Edit Ticket"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteWO}
                    className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-md transition-colors shadow-sm"
                    title="Delete Ticket"
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

          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 bg-white">
            {activeTab === "DETAILS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-4">Details</h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm">
                  <EditableRow label="LOCATION">
                    <select
                      value={wo.locationName || ""}
                      onChange={(e) =>
                        handleInlineUpdate("locationName", e.target.value, "updated the location")
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
                        handleInlineUpdate("assetId", e.target.value || null, "updated the asset")
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

                  <EditableRow label="ASSIGNEE">
                    <select
                      value={wo.assignedTo || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "assignedTo",
                          e.target.value || null,
                          "updated the assignee",
                        )
                      }
                      className="w-full bg-transparent text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
                    >
                      <option value="">Unassigned</option>
                      {orgUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </EditableRow>

                  <EditableRow label="CATEGORY">
                    <select
                      value={wo.category || ""}
                      onChange={(e) =>
                        handleInlineUpdate("category", e.target.value || null, "updated category")
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
                        handleInlineUpdate("priority", e.target.value, "updated priority")
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
                          "updated estimated hours",
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
                          "updated due date",
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3">
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={handleAddTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
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
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 accent-blue-600"
                        />
                        <span
                          className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTask(task.id)}
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Select a part...</option>
                    {orgParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(parseInt(e.target.value) || 1)}
                    className="w-16 bg-white border border-gray-300 rounded-lg text-center text-sm"
                  />
                  <button
                    onClick={handleAddPart}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Add
                  </button>
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
                        onClick={() => removePart(p.id)}
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Hours"
                    value={newTimeDuration}
                    onChange={(e) => setNewTimeDuration(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <button
                    onClick={handleAddTime}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
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
                        href={`http://${API_URL}${doc.fileUrl}`}
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

        {/* RIGHT SIDEBAR: COMMENTS & ACTIVITY (FLEX SIBLING INSTEAD OF ABSOLUTE OVERLAY) */}
        <div
          className={`flex flex-col bg-gray-50 shrink-0 border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
            isActivityOpen ? "w-full md:w-[380px]" : "w-0 border-l-0"
          }`}
        >
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0 flex items-center justify-between h-14 w-[380px]">
            <div className="flex items-center">
              <button
                onClick={() => setIsActivityOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-900 transition-colors mr-2"
                title="Close sidebar"
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

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 w-[380px]">
            {activities.length === 0 ? (
              <div className="text-center text-sm text-gray-400 italic mt-10">No activity yet.</div>
            ) : (
              activities.map((item: any, idx: number) => {
                const isSystemLog = item.type === "log";
                const isComment = item.type === "comment";
                const authorName = item.actor?.firstName || item.author?.firstName || "System";
                const initial = authorName.charAt(0).toUpperCase();

                return (
                  <div key={`${item.type}-${item.id}-${idx}`} className="flex gap-3 group">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${isSystemLog ? "bg-teal-600" : "bg-blue-600"}`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-xs text-gray-900">{authorName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div
                        className={`mt-1 text-xs md:text-sm ${isSystemLog ? "text-gray-500 italic" : "text-gray-900 bg-white border border-gray-200 p-2.5 rounded-xl shadow-sm"}`}
                      >
                        {item.action || item.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-200 shrink-0 w-[380px]">
            <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePostComment();
                }}
                placeholder="Write a message..."
                className="flex-1 bg-transparent py-2.5 px-3 text-xs md:text-sm outline-none"
              />
              <button onClick={handlePostComment} className="p-2.5 text-blue-600 hover:bg-blue-50">
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
