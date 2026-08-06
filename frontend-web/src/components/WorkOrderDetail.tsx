/* eslint-disable no-useless-assignment */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Paperclip, X, Save, FileText, UploadCloud } from "lucide-react";

// Helpers
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "CRITICAL": return "bg-red-100 text-red-800";
    case "HIGH": return "bg-orange-100 text-orange-800";
    case "MEDIUM": return "bg-yellow-100 text-yellow-800";
    case "LOW": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN": return "bg-gray-100 text-gray-800";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
    case "COMPLETE":
    case "CLOSED": return "bg-green-100 text-green-800";
    case "onHOLD": return "bg-orange-100 text-orange-800";
    case "REVIEW": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const WorkOrderDetail = ({ user }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);

  // TABS
  const [activeTab, setActiveTab] = useState<"ALL" | "COMMENTS" | "HISTORY" | "DOCUMENTS">("ALL");

  // COMMENTS STATE
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // DESCRIPTION STATE
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState("");

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

  // --- HANDLERS ---
  const handleInlineUpdate = async (field: string, value: any, logMessage: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value, actorId: user.id, actionLog: logMessage }),
      });
      if (res.ok) fetchWO();
    } catch (err) {
      alert(`Failed to update ${field}`);
    }
  };

  const saveDescription = () => {
    handleInlineUpdate("description", descText, "updated the description");
    setIsEditingDesc(false);
  };

  // Comments
  const handlePostComment = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newComment.trim()) {
      try {
        const res = await fetch(`http://localhost:8080/api/workorders/${id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newComment, authorId: user.id }),
        });
        if (res.ok) {
          setNewComment("");
          fetchWO();
        }
      } catch (err) {
        alert("Failed to post comment");
      }
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}/comments/${commentId}`, {
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
      const res = await fetch(`http://localhost:8080/api/workorders/${id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchWO();
    } catch (err) {
      alert("Failed to delete comment");
    }
  };

  // Real File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We must use FormData to send physical files over HTTP
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaderId", user.id);

    try {
      const res = await fetch(`http://localhost:8080/api/workorders/${id}/documents`, {
        method: "POST",
        body: formData, // Notice we don't set Content-Type; the browser handles it for FormData automatically
      });

      if (res.ok) {
        fetchWO(); // Refresh the page data to show the new document!
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload");
    }
  };

  if (loading) return <div className="p-8">Loading ticket...</div>;
  if (!wo) return <div className="p-8">Work Order not found</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center text-sm">
          <button onClick={() => navigate("/dashboard/workorders")} className="text-blue-600 hover:underline font-semibold">
            Work Orders
          </button>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 font-bold">WO-{wo.id}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">{wo.title}</h1>
          
          {/* DESCRIPTION SECTION */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Description</h3>
              {!isEditingDesc && (
                <button 
                  onClick={() => { setIsEditingDesc(true); setDescText(wo.description || ""); }} 
                  className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-md border"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden shadow-sm">
                <textarea 
                  value={descText} 
                  onChange={(e) => setDescText(e.target.value)} 
                  className="w-full p-4 text-sm text-gray-800 outline-none resize-y min-h-[120px]" 
                  placeholder="Add a detailed description..."
                />
                <div className="bg-gray-50 px-4 py-3 flex justify-end gap-2 border-t">
                  <button onClick={() => setIsEditingDesc(false)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </button>
                  <button onClick={saveDescription} className="flex items-center px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                    <Save className="w-4 h-4 mr-1" /> Save Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50/50 rounded-xl p-5 text-gray-700 min-h-[100px] border border-gray-100 whitespace-pre-wrap text-sm leading-relaxed shadow-sm">
                {wo.description || <span className="text-gray-400 italic">No description provided.</span>}
              </div>
            )}
          </div>

          {/* TABS SECTION */}
          <div>
            <div className="flex space-x-6 mb-6 border-b border-gray-100">
              {["ALL", "COMMENTS", "DOCUMENTS"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
              ))}
            </div>

            {/* DOCUMENTS TAB CONTENT */}
            {activeTab === "DOCUMENTS" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                  <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG, PDF or DOCX (max. 10MB)</p>
                </div>
                
                {/* Real List of Documents */}
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    Attached Files ({(wo.documents || []).length})
                  </h4>
                  
                  {(wo.documents && wo.documents.length > 0) ? (
                    <div className="space-y-3">
                      {wo.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <a 
                                href={`http://localhost:8080${doc.fileUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-bold text-blue-600 hover:underline truncate block"
                              >
                                {doc.fileName}
                              </a>
                              <span className="text-xs text-gray-500">
                                Uploaded by {doc.uploader?.firstName || 'User'} on {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                      No documents attached yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMMENTS & ACTIVITY TAB CONTENT */}
            {(activeTab === "ALL" || activeTab === "COMMENTS") && (
              <>
                <div className="flex items-start space-x-3 mb-8">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                    {user.firstName.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handlePostComment}
                      placeholder="Add a comment... (Press Enter to post)"
                      className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all"
                    />
                    <Paperclip className="absolute right-3 top-3 w-4 h-4 text-gray-400 hover:text-blue-600 cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Render Logs if on ALL tab */}
                  {activeTab === "ALL" && (wo.activityLogs || []).map((log: any) => (
                    <div key={log.id} className="flex items-start space-x-4">
                      <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        <span className="text-xs">🗓</span>
                      </div>
                      <div className="pt-1.5">
                        <p className="text-sm text-gray-800 leading-snug">
                          <span className="font-bold text-gray-900">{log.actor.firstName} {log.actor.lastName}</span> {log.action}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}

                  {/* Render Comments */}
                  {(wo.comments || []).map((comment: any) => (
                    <div key={comment.id} className="flex items-start space-x-4 group">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {comment.author.firstName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <span className="font-bold text-sm text-gray-900">{comment.author.firstName} {comment.author.lastName}</span>
                            <span className="text-xs text-gray-400 ml-2 font-medium">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                          
                          {/* EDIT / DELETE COMMENT CONTROLS */}
                          {comment.author.id === user.id && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }} className="text-gray-400 hover:text-blue-600 p-1">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-600 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* RENDER EDIT MODE OR TEXT MODE */}
                        {editingCommentId === comment.id ? (
                          <div className="mt-2">
                            <input 
                              type="text" 
                              value={editCommentText} 
                              onChange={(e) => setEditCommentText(e.target.value)} 
                              className="w-full border border-blue-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleUpdateComment(comment.id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md font-medium">Save</button>
                              <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-md font-medium">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-sm bg-white border border-gray-200 p-3.5 rounded-xl text-gray-800 shadow-sm inline-block min-w-[200px]">
                            {comment.text}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR (STATUS & DETAILS) */}
        <div className="w-80 overflow-y-auto p-6 bg-gray-50/50 shrink-0">
          <select
            value={wo.status}
            onChange={(e) => handleInlineUpdate("status", e.target.value, `updated status to ${e.target.value}`)}
            className={`w-full font-black uppercase text-sm border-0 rounded-xl p-3 mb-6 outline-none ring-1 shadow-sm cursor-pointer ${getStatusColor(wo.status)}`}
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="COMPLETE">COMPLETE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="onHOLD">ON HOLD</option>
          </select>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50/80 px-5 py-3.5 border-b border-gray-100 font-bold text-gray-900 text-sm flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-400" /> Details
            </div>
            <div className="p-5 space-y-6">
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Assignee</span>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  value={wo.assignee?.id || "unassigned"}
                  onChange={(e) => handleInlineUpdate("assignedTo", e.target.value === "unassigned" ? null : e.target.value, "updated assignee")}
                >
                  <option value="unassigned">Unassigned</option>
                  {(orgUsers || []).map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Priority</span>
                <select
                  className={`w-full p-2 border border-gray-200 rounded-lg text-sm font-bold outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 ${getPriorityColor(wo.priority)}`}
                  value={wo.priority}
                  onChange={(e) => handleInlineUpdate("priority", e.target.value, `updated Priority to ${e.target.value}`)}
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