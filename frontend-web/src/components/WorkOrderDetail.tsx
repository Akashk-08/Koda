/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  FileText,
  UploadCloud,
  Plus,
  X,
  Trash2,
  Pencil,
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

// Helper for unified activity feed
const combineAndSortActivity = (logs: any[] = [], comments: any[] = []) => {
  const combined = [
    ...logs.map((log) => ({ ...log, type: "log" })),
    ...comments.map((comment) => ({ ...comment, type: "comment" })),
  ];
  return combined.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const WorkOrderDetail = ({ user }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Organization Data for Dropdowns
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgAssets, setOrgAssets] = useState<any[]>([]);
  const [orgLocations, setOrgLocations] = useState<any[]>([]);
  const [orgParts, setOrgParts] = useState<any[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<
    "DETAILS" | "TASKS" | "TIME" | "PARTS" | "FILES"
  >("DETAILS");
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  // Title & Description Editing States
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");

  // Comment & Mentions State
  const [newComment, setNewComment] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Simulated Local States for new interactive tabs
  const [tasks, setTasks] = useState<
    { id: number; text: string; completed: boolean }[]
  >([]);
  const [newTaskText, setNewTaskText] = useState("");

  const [parts, setParts] = useState<
    { id: number; partId: string; name: string; qty: number }[]
  >([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  const [timeEntries, setTimeEntries] = useState<
    { id: number; worker: string; duration: number; date: string }[]
  >([]);
  const [newTimeDuration, setNewTimeDuration] = useState("");

  const fetchWO = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`);
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
      fetch(`http://localhost:8080/api/users/${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgUsers);
      fetch(`http://localhost:8080/api/assets?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgAssets);
      fetch(`http://localhost:8080/api/locations?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgLocations);
      fetch(`http://localhost:8080/api/inventory?orgId=${user.organizationId}`)
        .then((res) => res.json())
        .then(setOrgParts);
    }
  }, [id, user?.organizationId]);

  // Mentions Logic
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
    (u.firstName + " " + u.lastName)
      .toLowerCase()
      .includes(mentionQuery.toLowerCase()),
  );

  // Header Editing Handlers (Title/Desc)
  const startEditingHeader = () => {
    setHeaderTitle(wo.title);
    setHeaderDesc(wo.description || "");
    setIsEditingHeader(true);
  };

  const handleSaveHeader = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`, {
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
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`, {
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

  // Work Order Update Handlers
  const handleStatusChange = async (status: string) => {
    try {
      await fetch(`http://localhost:8080/api/workorders/${id}`, {
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

  const handleInlineUpdate = async (
    field: string,
    value: any,
    logMessage: string,
  ) => {
    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`, {
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

  // Comments Handlers
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/workorders/${id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newComment, authorId: user.id }),
        },
      );
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
      const res = await fetch(
        `http://localhost:8080/api/workorders/${id}/comments/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: editCommentText }),
        },
      );
      if (res.ok) {
        setEditingCommentId(null);
        fetchWO();
      }
    } catch (err) {
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      const res = await fetch(
        `http://localhost:8080/api/workorders/${id}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) fetchWO();
    } catch (err) {
      alert("Failed to delete comment");
    }
  };

  // File Upload Handler (Paperclip)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaderId", user.id);

    try {
      const res = await fetch(
        `http://localhost:8080/api/workorders/${id}/documents`,
        { method: "POST", body: formData },
      );
      if (res.ok) fetchWO();
    } catch (error) {
      alert("An error occurred during upload");
    }
  };

  // Other Tab Handlers
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, completed: false },
    ]);
    setNewTaskText("");
  };
  const toggleTask = (taskId: number) =>
    setTasks(
      tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    );
  const removeTask = (taskId: number) =>
    setTasks(tasks.filter((t) => t.id !== taskId));

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
  const removeTime = (id: number) =>
    setTimeEntries(timeEntries.filter((t) => t.id !== id));

  const activities = useMemo(
    () => combineAndSortActivity(wo?.activityLogs, wo?.comments),
    [wo],
  );

  if (loading)
    return (
      <div className="p-8 text-gray-500 flex items-center justify-center h-full">
        Loading ticket...
      </div>
    );
  if (!wo) return <div className="p-8 text-gray-500">Work Order not found</div>;

  const isCompleted = wo.status === "COMPLETE" || wo.status === "CLOSED";

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/workspace/workorders")}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 text-lg">WO-{wo.id}</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={wo.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`flex items-center px-4 py-2 rounded-md font-bold text-sm cursor-pointer outline-none border transition-colors ${
              isCompleted
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="onHOLD">On Hold</option>
            <option value="COMPLETE">Complete</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200">
          {/* Editable Header Area */}
          <div className="px-10 pt-8 pb-6 shrink-0 relative group">
            {isEditingHeader ? (
              <div className="space-y-4 max-w-4xl">
                <input
                  autoFocus
                  className="w-full text-2xl font-black text-gray-900 border border-blue-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 shadow-sm transition-all"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  placeholder="Work Order Title"
                />
                <textarea
                  className="w-full text-sm text-gray-800 border border-blue-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-600 resize-y min-h-[120px] bg-gray-50 shadow-sm transition-all"
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
                <div className="flex-1 pr-6">
                  <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                    {wo.title}
                  </h1>
                  <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                    {wo.description || "No description provided."}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

          <div className="px-10 border-b border-gray-200 flex gap-8 shrink-0">
            {["DETAILS", "TASKS", "TIME", "PARTS", "FILES"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-8 bg-white">
            {/* DETAILS TAB */}
            {activeTab === "DETAILS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  Details
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  <EditableRow label="LOCATION">
                    <select
                      value={wo.locationName || ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "locationName",
                          e.target.value,
                          "updated the location",
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
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
                          "updated the asset",
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
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
                      className="w-full bg-transparent text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer outline-none"
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
                        handleInlineUpdate(
                          "category",
                          e.target.value || null,
                          "updated category",
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium text-gray-900 cursor-pointer outline-none"
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
                          "updated priority",
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium text-gray-900 cursor-pointer outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </EditableRow>

                  <EditableRow label="EST. DURATION (HRS)">
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
                      className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none"
                    />
                  </EditableRow>

                  <EditableRow label="DUE DATE">
                    <input
                      type="date"
                      value={wo.dueDate ? wo.dueDate.split("T")[0] : ""}
                      onChange={(e) =>
                        handleInlineUpdate(
                          "dueDate",
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                          "updated due date",
                        )
                      }
                      className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none cursor-pointer"
                    />
                  </EditableRow>

                  <div className="flex items-center py-4 px-6 bg-gray-50/30">
                    <div className="w-48 text-xs font-bold text-gray-500 tracking-wider shrink-0">
                      CREATED
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      {new Date(wo.createdAt).toLocaleString()} by{" "}
                      {wo.creator
                        ? `${wo.creator.firstName} ${wo.creator.lastName}`
                        : wo.requestedByEmail || "System"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === "TASKS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  Tasks & Checklists
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3">
                  <input
                    type="text"
                    placeholder="Add a new checklist item..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleAddTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700"
                  >
                    Add Task
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">
                      No tasks added to this work order
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                            className="w-5 h-5 cursor-pointer accent-blue-600"
                          />
                          <span
                            className={`text-sm font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}
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
                )}
              </div>
            )}

            {/* PARTS TAB */}
            {activeTab === "PARTS" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  Parts
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="">Select a part from inventory...</option>
                    {orgParts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.availableQty} available)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) =>
                      setSelectedPartQty(parseInt(e.target.value) || 1)
                    }
                    className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none text-center"
                  />
                  <button
                    onClick={handleAddPart}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                {parts.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">
                      No parts added to this work order
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <span className="text-sm font-bold text-gray-800">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-600">
                            Qty: {p.qty}
                          </span>
                          <button
                            onClick={() => removePart(p.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TIME TAB */}
            {activeTab === "TIME" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  Time Log
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex gap-3 items-center">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-500 cursor-not-allowed">
                    Worker: {user.firstName} {user.lastName}
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Hours (e.g. 1.5)"
                    value={newTimeDuration}
                    onChange={(e) => setNewTimeDuration(e.target.value)}
                    className="w-40 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none text-center focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleAddTime}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700"
                  >
                    Log Time
                  </button>
                </div>

                {timeEntries.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <p className="text-sm font-medium text-gray-500">
                      No time entries recorded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeEntries.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <span className="block text-sm font-bold text-gray-800">
                            {t.worker}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-gray-700">
                            {t.duration} hrs
                          </span>
                          <button
                            onClick={() => removeTime(t.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FILES TAB */}
            {activeTab === "FILES" && (
              <div className="max-w-3xl">
                <h3 className="text-base font-bold text-gray-900 mb-6">
                  Files
                </h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group mb-6">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                  <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-gray-900">
                    Click to upload or drag and drop
                  </p>
                </div>

                <div className="space-y-3">
                  {(wo.documents || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <FileText className="w-8 h-8 text-blue-100 bg-blue-600 p-1.5 rounded shrink-0 mr-3" />
                      <div>
                        <a
                          href={`http://localhost:8080${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-blue-600 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                        <p className="text-xs text-gray-500">
                          Uploaded by {doc.uploader?.firstName || "User"} on{" "}
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: COMMENTS & ACTIVITY (COLLAPSIBLE) */}
        <div
          className={`flex flex-col bg-gray-50 shrink-0 border-l border-gray-200 relative transition-all duration-300 ease-in-out ${isActivityOpen ? "w-[400px]" : "w-[50px] overflow-hidden"}`}
        >
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0 flex items-center h-14">
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-900 transition-colors shrink-0"
            >
              <ArrowLeft
                className={`w-5 h-5 transition-transform duration-300 ${isActivityOpen ? "rotate-180" : "rotate-0"}`}
              />
            </button>
            <h3
              className={`text-sm font-black tracking-wide text-gray-900 ml-3 transition-opacity duration-200 ${isActivityOpen ? "opacity-100" : "opacity-0 whitespace-nowrap"}`}
            >
              Comments
            </h3>
          </div>

          <div
            className={`flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth transition-opacity duration-300 ${isActivityOpen ? "opacity-100" : "opacity-0 hidden"}`}
          >
            {activities.length === 0 ? (
              <div className="text-center text-sm text-gray-400 italic mt-10">
                No activity yet.
              </div>
            ) : (
              activities.map((item: any, idx: number) => {
                const isSystemLog = item.type === "log";
                const isComment = item.type === "comment";
                const authorName =
                  item.actor?.firstName || item.author?.firstName || "System";
                const initial = authorName.charAt(0).toUpperCase();

                const isMyComment = isComment && item.author?.id === user?.id;

                return (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    className="flex gap-4 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${isSystemLog ? "bg-teal-600" : "bg-blue-600"}`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-sm text-gray-900 truncate">
                          {authorName}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {isMyComment && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border border-gray-200 rounded-md shadow-sm">
                              <button
                                onClick={() => {
                                  setEditingCommentId(item.id);
                                  setEditCommentText(item.text);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors border-l border-gray-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <span className="text-[11px] font-medium text-gray-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {editingCommentId === item.id ? (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full border border-blue-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateComment(item.id)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-xs text-gray-600 hover:bg-gray-200 bg-gray-100 px-3 py-1.5 rounded-md font-bold transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`mt-1 text-sm ${isSystemLog ? "text-gray-500 italic" : "text-gray-900 bg-white border border-gray-200 p-3 rounded-tr-xl rounded-b-xl shadow-sm leading-relaxed whitespace-pre-wrap"}`}
                        >
                          {/* Highlighting @ mentions in the text */}
                          {(item.action || item.text || "")
                            .split(/(@\w+\s\w+)/g)
                            .map((part: string, i: number) =>
                              part.startsWith("@") ? (
                                <span
                                  key={i}
                                  className="text-blue-600 font-bold bg-blue-50 px-1 rounded"
                                >
                                  {part}
                                </span>
                              ) : (
                                part
                              ),
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            className={`p-4 bg-white border-t border-gray-200 shrink-0 transition-opacity duration-300 relative ${isActivityOpen ? "opacity-100" : "opacity-0 hidden"}`}
          >
            {showMentions && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 shadow-2xl rounded-xl max-h-48 overflow-y-auto z-50">
                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  Mention a user
                </div>
                {filteredMentions.length > 0 ? (
                  filteredMentions.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => insertMention(u)}
                      className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-blue-50 focus:bg-blue-50 outline-none transition-colors"
                    >
                      {u.firstName} {u.lastName}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400 italic">
                    No users found.
                  </div>
                )}
              </div>
            )}

            <div className="relative flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all overflow-hidden">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={handleCommentChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showMentions) handlePostComment();
                }}
                placeholder="Write a message... Use @ to mention"
                className="flex-1 bg-transparent py-3 text-sm outline-none text-gray-900 placeholder-gray-400"
                autoComplete="off"
              />

              <button
                onClick={handlePostComment}
                className={`p-3 transition-colors ${newComment.trim() ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`}
                disabled={!newComment.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center py-3.5 px-6 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
    <div className="w-48 text-xs font-bold text-gray-500 tracking-wider shrink-0">
      {label}
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

export default WorkOrderDetail;
