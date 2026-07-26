/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  Link,
  useLocation,
} from "react-router-dom";

// --- INTERFACES ---
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

interface ActivityLog {
  id: string;
  action: string;
  createdAt: string;
  actor: { firstName: string; lastName: string };
}

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  category?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "onHOLD" | "COMPLETE" | "REVIEW" | "CLOSED";
  createdAt: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  assignee?: { id: string; firstName: string; lastName: string } | null;
  creator?: { id: string; firstName: string; lastName: string } | null;
  comments?: Comment[];
  activityLogs?: ActivityLog[]; // Made optional to prevent crashes
}

interface AuthCardProps {
  initialMode: "login" | "signup";
  onAuthSuccess: (user: User) => void;
}

// --- ICONS ---
const IconGrid = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);
const IconList = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
const IconUsers = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const IconBox = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "LOW":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-gray-100 text-gray-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "COMPLETE":
    case "CLOSED":
      return "bg-green-100 text-green-800";
    case "onHOLD":
      return "bg-orange-100 text-orange-800";
    case "REVIEW":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// --- WORK ORDER DETAIL VIEW (JIRA STYLE INTERACTIVE) ---
const WorkOrderDetail = ({ user }: { user: User }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Interactive UI States
  const [activeTab, setActiveTab] = useState<"ALL" | "COMMENTS" | "HISTORY">(
    "ALL",
  );
  const [newComment, setNewComment] = useState("");
  const [orgUsers, setOrgUsers] = useState<User[]>([]);

  // Fetch logic
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

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/${user.organizationId}`,
      );
      if (res.ok) setOrgUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWO();
    fetchUsers();
  }, [id]);

  // Generic Update Handler (Saves inline edits AND adds history logs)
  const handleInlineUpdate = async (
    field: string,
    value: any,
    logMessage: string,
  ) => {
    try {
      const payload = {
        [field]: value,
        actorId: user.id,
        actionLog: logMessage,
      };
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) fetchWO();
    } catch (err) {
      alert(`Failed to update ${field}`);
    }
  };

  const handlePostComment = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && newComment.trim()) {
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
          fetchWO();
        }
      } catch (err) {
        alert("Failed to post comment");
      }
    }
  };

  if (loading) return <div className="p-8">Loading ticket...</div>;
  if (!wo) return <div className="p-8">Work Order not found</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center text-sm">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:underline"
          >
            Projects
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:underline"
          >
            Koda Maintenance
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">WO-{wo.id}</span>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors border border-gray-200"
        >
          Edit Ticket
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column (Main Content) */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{wo.title}</h1>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700 min-h-[100px] border border-gray-100 whitespace-pre-wrap">
              {wo.description || "No description provided."}
            </div>
          </div>

          {/* Activity Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity
            </h3>
            <div className="flex space-x-4 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-2 text-sm font-medium ${activeTab === "ALL" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("COMMENTS")}
                className={`px-4 py-2 text-sm font-medium ${activeTab === "COMMENTS" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`px-4 py-2 text-sm font-medium ${activeTab === "HISTORY" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                History
              </button>
            </div>

            {/* Live Comment Input */}
            <div className="flex items-start space-x-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handlePostComment}
                  placeholder="Add a comment... (Press Enter to post)"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="space-y-6">
              {(activeTab === "ALL" || activeTab === "HISTORY") &&
                (wo.activityLogs || []).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">
                          {log.actor.firstName} {log.actor.lastName}
                        </span>{" "}
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

              {(activeTab === "ALL" || activeTab === "COMMENTS") &&
                (wo.comments || []).map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {comment.author.firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-semibold text-sm text-gray-900">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-800 bg-white border border-gray-200 p-3 rounded-lg shadow-sm whitespace-pre-wrap">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column (INTERACTIVE DETAILS) */}
        <div className="w-80 overflow-y-auto p-6 bg-white shrink-0">
          <div className="mb-6">
            <select
              value={wo.status}
              onChange={(e) =>
                handleInlineUpdate(
                  "status",
                  e.target.value,
                  `updated status to ${e.target.value}`,
                )
              }
              className={`w-full font-bold uppercase text-sm border-0 rounded p-2 cursor-pointer outline-none ring-1 ring-gray-200 hover:ring-blue-400 transition-all ${getStatusColor(wo.status)}`}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="COMPLETE">COMPLETE</option>
              <option value="CLOSED">CLOSED</option>
              <option value="onHOLD">ON HOLD</option>
            </select>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-900 text-sm">
              Details
            </div>
            <div className="p-4 space-y-5">
              {/* Inline Editable Assignee */}
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Assignee
                </span>
                <select
                  className="w-full bg-transparent text-sm font-medium text-gray-900 hover:bg-gray-50 p-1 -ml-1 rounded cursor-pointer outline-none"
                  value={wo.assignee?.id || "unassigned"}
                  onChange={(e) => {
                    const newName =
                      (orgUsers || []).find((u) => u.id === e.target.value)
                        ?.firstName || "Unassigned";
                    handleInlineUpdate(
                      "assignedTo",
                      e.target.value === "unassigned" ? null : e.target.value,
                      `changed Assignee to ${newName}`,
                    );
                  }}
                >
                  <option value="unassigned">Unassigned</option>
                  {(orgUsers || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inline Editable Priority */}
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Priority
                </span>
                <select
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium cursor-pointer outline-none ${getPriorityColor(wo.priority)}`}
                  value={wo.priority}
                  onChange={(e) =>
                    handleInlineUpdate(
                      "priority",
                      e.target.value,
                      `updated Priority to ${e.target.value}`,
                    )
                  }
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* Inline Editable Due Date */}
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Due Date
                </span>
                <input
                  type="date"
                  value={wo.dueDate ? wo.dueDate.split("T")[0] : ""}
                  onChange={(e) =>
                    handleInlineUpdate(
                      "dueDate",
                      e.target.value,
                      `changed Due Date to ${e.target.value}`,
                    )
                  }
                  className="bg-transparent text-sm text-gray-900 font-medium hover:bg-gray-50 p-1 -ml-1 rounded cursor-pointer outline-none"
                />
              </div>

              {/* Inline Editable Est Hours */}
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Est. Hours
                </span>
                <input
                  type="number"
                  value={wo.estimatedHours || ""}
                  placeholder="0"
                  onBlur={(e) =>
                    handleInlineUpdate(
                      "estimatedHours",
                      e.target.value,
                      `updated Estimated Hours to ${e.target.value}`,
                    )
                  }
                  className="w-full bg-transparent text-sm text-gray-900 font-medium hover:bg-gray-50 p-1 -ml-1 rounded outline-none border border-transparent focus:border-blue-300"
                />
              </div>

              {/* Reporter (Non-editable generally, but shown) */}
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Reporter
                </span>
                <div className="flex items-center text-sm font-medium text-gray-900 p-1 -ml-1">
                  <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold mr-2">
                    {wo.creator?.firstName.charAt(0).toUpperCase() || "S"}
                  </div>
                  {wo.creator
                    ? `${wo.creator.firstName} ${wo.creator.lastName}`
                    : "System"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {wo && (
        <EditWorkOrderModal
          key={wo.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
          workOrder={wo}
          onUpdated={fetchWO}
        />
      )}
    </div>
  );
};

// --- EDIT MODAL & CREATE MODAL ---
interface EditWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  workOrder: WorkOrder;
  onUpdated: () => void;
}
const EditWorkOrderModal = ({
  isOpen,
  onClose,
  user,
  workOrder,
  onUpdated,
}: EditWorkOrderModalProps) => {
  const [title, setTitle] = useState(workOrder.title);
  const [category, setCategory] = useState(
    workOrder.category || "Select category...",
  );
  const [priority, setPriority] = useState(workOrder.priority);
  const [description, setDescription] = useState(workOrder.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;
  const handleUpdate = async () => {
    if (!title) return alert("Title is required!");
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/workorders/${workOrder.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category: category !== "Select category..." ? category : null,
            priority,
            actorId: user.id,
            actionLog: "edited the main ticket details",
          }),
        },
      );
      if (res.ok) {
        onUpdated();
        onClose();
      } else alert("Failed to update work order.");
    } catch (error) {
      alert("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Edit Work Order: WO-{workOrder.id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Work Order Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 px-3 py-2 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg text-gray-900 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option>Select category...</option>
                <option value="ANNUAL_PREVENTIVE_MAINTENANCE">
                  Annual Preventive Maintenance
                </option>
                <option value="ASSETS">Assets</option>
                <option value="PARTS_REQUEST">Parts Request</option>
                <option value="SUPPORT_REQUEST">Support Request</option>
                <option value="LARGE_DAMAGE">Large Damage</option>
                <option value="SIX_MONTH_PREVENTIVE_MAINTENANCE">
                  Six Months PM
                </option>
                <option value="PROJECT_UPGRADE">Project/Upgrade</option>
                <option value="WEEKLY_MONTHLY_CHECKLISTS">
                  Weekly/Monthly checklists
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded-lg text-gray-900 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Update details..."
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg mr-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateWorkOrderModal = ({ isOpen, onClose, user, onCreated }: any) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [tasks, setTasks] = useState<
    { id: number; text: string; completed: boolean }[]
  >([{ id: 1, text: "Inspect for physical damage", completed: false }]);
  const [newTaskText, setNewTaskText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [assignees, setAssignees] = useState<string[]>([
    `${user.firstName} ${user.lastName}`,
  ]);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;
      if (!user.organizationId)
        return setUsersError(
          "Please log out and log back in to refresh your session.",
        );
      setUsersLoading(true);
      setUsersError("");
      try {
        const res = await fetch(
          `http://localhost:8080/api/users/${user.organizationId}`,
        );
        if (!res.ok) throw new Error("Backend route missing.");
        const data = await res.json();
        if (Array.isArray(data))
          setOrgUsers(data.map((u: any) => `${u.firstName} ${u.lastName}`));
        else throw new Error("Invalid format.");
      } catch (err: any) {
        setUsersError(err.message || "Failed to load users.");
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [isOpen, user.organizationId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title) return alert("Title is required!");
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8080/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: category !== "Select category..." ? category : null,
          priority,
          organizationId: user.organizationId,
          createdBy: user.id,
        }),
      });
      if (response.ok) {
        setTitle("");
        setDescription("");
        setCategory("");
        setPriority("MEDIUM");
        onCreated();
        onClose();
      } else alert("Failed to create work order.");
    } catch (error) {
      alert("Server error while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatText = (prefix: string, suffix: string) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    setDescription(
      `${text.substring(0, start)}${prefix}${text.substring(start, end)}${suffix}${text.substring(end)}`,
    );
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, completed: false },
    ]);
    setNewTaskText("");
  };
  const removeTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));
  const toggleTask = (id: number) =>
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };
  const addAssignee = (name: string) => {
    if (!assignees.includes(name)) setAssignees([...assignees, name]);
    setIsTeamDropdownOpen(false);
  };
  const removeAssignee = (name: string) =>
    setAssignees(assignees.filter((a) => a !== name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Work Order</h2>
          <div className="flex space-x-2 text-gray-500">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <p className="text-xs text-gray-500">
            Required fields are marked with an asterisk{" "}
            <span className="text-red-500">*</span>
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Work Order Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 px-3 py-2 outline-none transition-colors"
              placeholder="e.g., PC - HardWare - VC000[PCID]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg text-gray-900 px-3 py-2 outline-none focus:border-blue-500 appearance-none"
              >
                <option>Select category...</option>
                <option value="ANNUAL_PREVENTIVE_MAINTENANCE">
                  Annual Preventive Maintenance
                </option>
                <option value="ASSETS">Assets</option>
                <option value="PARTS_REQUEST">Parts Request</option>
                <option value="SUPPORT_REQUEST">Support Request</option>
                <option value="LARGE_DAMAGE">Large Damage</option>
                <option value="SIX_MONTH_PREVENTIVE_MAINTENANCE">
                  Six Months PM
                </option>
                <option value="PROJECT_UPGRADE">Project/Upgrade</option>
                <option value="WEEKLY_MONTHLY_CHECKLISTS">
                  Weekly/Monthly checklists
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg text-gray-900 px-3 py-2 outline-none focus:border-blue-500 appearance-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <div className="border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
              <div className="flex items-center space-x-1 border-b border-gray-200 p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => formatText("**", "**")}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText("*", "*")}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                >
                  <span className="italic">I</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatText("<u>", "</u>")}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600 underline"
                >
                  U
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => formatText("- ", "")}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </button>
              </div>
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-transparent text-gray-900 px-3 py-2 outline-none resize-y min-h-[100px] placeholder-gray-400"
                placeholder="Add details, instructions, or steps required..."
              />
            </div>
          </div>

          {/* Job Specifications */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Job Specifications
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Target Asset
                </label>
                <select className="w-full bg-white border border-gray-300 rounded text-gray-900 px-3 py-1.5 outline-none text-sm appearance-none focus:border-blue-500">
                  <option>Select asset...</option>
                  <option value="VC110">VC110</option>
                  <option value="VC210">VC210</option>
                  <option value="VC310">VC310</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-300 rounded text-gray-900 px-3 py-1.5 outline-none text-sm focus:border-blue-500 placeholder-gray-400"
                  placeholder="e.g., Building 4, Roof"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-300 rounded text-gray-900 px-3 py-1.5 outline-none text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-300 rounded text-gray-900 px-3 py-1.5 outline-none text-sm focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                  Est. Duration (hrs)
                </label>
                <input
                  type="number"
                  className="w-full bg-white border border-gray-300 rounded text-gray-900 px-3 py-1.5 outline-none text-sm focus:border-blue-500 placeholder-gray-400"
                  placeholder="2.5"
                />
              </div>
            </div>
          </div>

          {/* Assignees Dropdown */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Assignees
            </label>
            <div className="bg-white border border-gray-300 rounded-lg p-2 flex flex-wrap gap-2 items-center">
              {assignees.map((assigneeName, index) => (
                <div
                  key={index}
                  className="bg-gray-100 border border-gray-200 rounded-full px-3 py-1 flex items-center space-x-2"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 font-medium">
                    {assigneeName}{" "}
                    {index === 0 && (
                      <span className="text-xs text-gray-500 font-normal">
                        (Primary)
                      </span>
                    )}
                  </span>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => removeAssignee(assigneeName)}
                      className="text-gray-400 hover:text-red-500 ml-1 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                  className="text-sm text-blue-600 font-medium hover:underline px-2"
                >
                  + Add team member
                </button>
                {isTeamDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden py-1">
                    {usersLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500 italic">
                        Fetching users...
                      </div>
                    ) : usersError ? (
                      <div className="px-4 py-3 text-sm text-red-500 italic bg-red-50">
                        {usersError}
                      </div>
                    ) : (
                      <>
                        {(orgUsers || [])
                          .filter((u) => !assignees.includes(u))
                          .map((u) => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => addAssignee(u)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                            >
                              {u}
                            </button>
                          ))}
                        {(orgUsers || []).filter((u) => !assignees.includes(u))
                          .length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 italic bg-gray-50">
                            All org users assigned.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors text-center relative group">
              <input
                type="file"
                multiple
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 mb-3 group-hover:scale-105 transition-transform">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Drop photos or files to attach, or{" "}
                <label
                  htmlFor="file-upload"
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  browse
                </label>
              </p>
            </div>
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() =>
                        setFiles(files.filter((_, index) => index !== i))
                      }
                      className="ml-2 hover:text-red-500 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Task Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Task Checklist
              </label>
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className={`text-sm flex-1 ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
                  >
                    {task.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              <div className="flex items-center space-x-2 mt-3">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="bg-white border border-gray-300 rounded-lg text-sm text-gray-900 px-3 py-2 flex-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                  placeholder="Type a new task..."
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="text-sm font-medium bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span>Create another</span>
          </label>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TABLE LIST COMPONENT ---
const WorkOrderTable = ({
  workOrders,
  isLoading,
  onOpenModal,
}: {
  workOrders: WorkOrder[];
  isLoading: boolean;
  onOpenModal: () => void;
}) => {
  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>Projects</span>
          <span className="mx-2">/</span>
          <span>Koda Maintenance</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          My Team Dashboard
        </h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <a
            href="#"
            className="border-blue-500 text-blue-600 whitespace-nowrap pb-3 border-b-2 font-medium text-sm"
          >
            List View
          </a>
          <a
            href="#"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-3 border-b-2 font-medium text-sm"
          >
            Board
          </a>
          <a
            href="#"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap pb-3 border-b-2 font-medium text-sm"
          >
            Timeline
          </a>
        </nav>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title / Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Loading work orders...
                </td>
              </tr>
            ) : !workOrders || workOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No work orders created yet. Click "+ Create" to start!
                </td>
              </tr>
            ) : (
              (workOrders || []).map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400 group-hover:text-gray-600">
                    <IconBox />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/dashboard/workorder/${wo.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer block"
                    >
                      {wo.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                      WO-{wo.id} • {new Date(wo.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {wo.assignee ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
                          {wo.assignee.firstName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">
                          {wo.assignee.firstName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold mr-2">
                          U
                        </div>
                        <span className="text-sm text-gray-500">
                          Unassigned
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(wo.priority)}`}
                    >
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(wo.status)}`}
                    >
                      {wo.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onOpenModal}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center font-medium"
          >
            + Create new issue
          </button>
        </div>
      </div>
    </main>
  );
};

// --- AUTH COMPONENT ---
const AuthCard = ({ initialMode, onAuthSuccess }: AuthCardProps) => {
  const [isLogin] = useState(initialMode === "login");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isLogin && formData.password !== formData.confirmPassword)
      return setErrorMsg("Passwords do not match!");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.user || data);
        navigate("/dashboard");
      } else {
        setErrorMsg(data.error || "Authentication failed");
      }
    } catch (err: unknown) {
      setErrorMsg("Failed to connect to the server.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 mb-2">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Sign in to Koda" : "Create your Koda account"}
          </h2>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  type="text"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  type="text"
                  placeholder="First Name"
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
                <input
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  type="text"
                  placeholder="Last Name"
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Email
            </label>
            <input
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              type="email"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              type="password"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                type="password"
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors mt-2"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => navigate(isLogin ? "/signup" : "/login")}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isLogin ? "Create an account" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/workorders");
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchWorkOrders();
    };
    if (
      location.pathname === "/dashboard" ||
      location.pathname === "/dashboard/"
    ) {
      loadData();
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold mr-3 shadow-sm">
            K
          </div>
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            Koda CMMS
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50"
              >
                <span className="mr-3 text-blue-600">
                  <IconGrid />
                </span>
                Dashboard
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconList />
                </span>
                Projects
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconList />
                </span>
                Work Orders
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconList />
                </span>
                Board
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Preventive Maintenance
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Request
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Plans
              </a>
            </li>
          </ul>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Organization
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                My Team
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                Locations
              </a>
            </li>
          </ul>
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Resources
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                File Management
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                Schedular/Calendar
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                Report
              </a>
            </li>
            <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Procurement
            </div>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-gray-400">
                <IconUsers />
              </span>
              Parts Inventory
            </a>
            <a
              href="#"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
            >
              <span className="mr-3 text-gray-400">
                <IconUsers />
              </span>
              Inventory
            </a>
          </ul>
        </nav>

        {/* User Footer in Sidebar */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {user.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
          <div className="flex-1 flex items-center">
            <div className="max-w-md w-full relative">
              <input
                type="text"
                placeholder="Search work orders, assets..."
                className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Create
            </button>
            <button
              onClick={onSignOut}
              className="text-sm font-medium text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* ROUTING LOGIC: Show Table OR Details based on the URL. */}
        <Routes>
          {/* Main Table View */}
          <Route
            path="/"
            element={
              <WorkOrderTable
                workOrders={workOrders}
                isLoading={isLoading}
                onOpenModal={() => setIsModalOpen(true)}
              />
            }
          />

          {/* Detail View */}
          <Route
            path="/workorder/:id"
            element={<WorkOrderDetail user={user} />}
          />
        </Routes>

        {/* Render Modal */}
        <CreateWorkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          onCreated={fetchWorkOrders}
        />
      </div>
    </div>
  );
};

// --- APP WRAPPER ---
export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("koda_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("koda_user", JSON.stringify(u));
  };
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("koda_user");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AuthCard initialMode="login" onAuthSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AuthCard initialMode="signup" onAuthSuccess={handleLogin} />
            )
          }
        />

        {/* Everything inside Dashboard stays in the layout */}
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <Dashboard user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </BrowserRouter>
  );
}
