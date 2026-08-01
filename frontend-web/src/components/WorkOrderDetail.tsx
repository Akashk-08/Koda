/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Helpers
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

const WorkOrderDetail = ({ user }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "COMMENTS" | "HISTORY">(
    "ALL",
  );
  const [newComment, setNewComment] = useState("");
  const [orgUsers, setOrgUsers] = useState<any[]>([]);

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
    fetch(`http://localhost:8080/api/users/${user.organizationId}`)
      .then((res) => res.json())
      .then((data) => setOrgUsers(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center text-sm">
          <button
            onClick={() => navigate("/workorders")}
            className="text-blue-600 hover:underline"
          >
            Work Orders
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-medium">WO-{wo.id}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{wo.title}</h1>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700 min-h-[100px] border whitespace-pre-wrap">
              {wo.description || "No description provided."}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity
            </h3>
            <div className="flex space-x-4 mb-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-2 text-sm font-medium ${activeTab === "ALL" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("COMMENTS")}
                className={`px-4 py-2 text-sm font-medium ${activeTab === "COMMENTS" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
              >
                Comments
              </button>
            </div>

            <div className="flex items-start space-x-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {user.firstName.charAt(0)}
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handlePostComment}
                placeholder="Add a comment... (Press Enter to post)"
                className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-6">
              {(activeTab === "ALL" || activeTab === "HISTORY") &&
                (wo.activityLogs || []).map((log: any) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      🗓
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
                (wo.comments || []).map((comment: any) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {comment.author.firstName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <div className="mt-1 text-sm bg-white border p-3 rounded-lg">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="w-80 overflow-y-auto p-6 bg-white shrink-0">
          <select
            value={wo.status}
            onChange={(e) =>
              handleInlineUpdate(
                "status",
                e.target.value,
                `updated status to ${e.target.value}`,
              )
            }
            className={`w-full font-bold uppercase text-sm border-0 rounded p-2 mb-6 outline-none ring-1 ${getStatusColor(wo.status)}`}
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="onHOLD">ON HOLD</option>
          </select>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b font-semibold text-gray-900 text-sm">
              Details
            </div>
            <div className="p-4 space-y-5">
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Assignee
                </span>
                <select
                  className="w-full bg-transparent text-sm font-medium text-gray-900 outline-none"
                  value={wo.assignee?.id || "unassigned"}
                  onChange={(e) =>
                    handleInlineUpdate(
                      "assignedTo",
                      e.target.value === "unassigned" ? null : e.target.value,
                      "updated assignee",
                    )
                  }
                >
                  <option value="unassigned">Unassigned</option>
                  {(orgUsers || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 mb-1">
                  Priority
                </span>
                <select
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium outline-none ${getPriorityColor(wo.priority)}`}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetail;
