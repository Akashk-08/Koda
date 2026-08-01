/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useRef } from "react";

const CreateWorkOrderModal = ({ isOpen, onClose, user, onCreated }: any) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Inspect for physical damage", completed: false },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [assignees, setAssignees] = useState<string[]>([
    `${user.firstName} ${user.lastName}`,
  ]);
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !user.organizationId) return;
      try {
        const res = await fetch(
          `http://localhost:8080/api/users/${user.organizationId}`,
        );
        const data = await res.json();
        if (Array.isArray(data))
          setOrgUsers(data.map((u: any) => `${u.firstName} ${u.lastName}`));
      } catch (err) {
        console.error(err);
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

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      { id: Date.now(), text: newTaskText, completed: false },
    ]);
    setNewTaskText("");
  };

  const toggleTask = (id: number) =>
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  const removeTask = (id: number) => setTasks(tasks.filter((t) => t.id !== id));
  const addAssignee = (name: string) => {
    if (!assignees.includes(name)) setAssignees([...assignees, name]);
    setIsTeamDropdownOpen(false);
  };
  const removeAssignee = (name: string) =>
    setAssignees(assignees.filter((a) => a !== name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Work Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded"
          >
            ✕
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
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option>Select category...</option>
                <option value="ASSETS">Assets</option>
                <option value="SUPPORT_REQUEST">Support Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none"
            />
          </div>

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
                  <span className="text-sm font-medium">{assigneeName}</span>
                  {index !== 0 && (
                    <button
                      onClick={() => removeAssignee(assigneeName)}
                      className="text-red-500 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                className="text-sm text-blue-600 font-medium"
              >
                + Add team member
              </button>
              {isTeamDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border shadow-xl z-10 py-1">
                  {orgUsers
                    .filter((u) => !assignees.includes(u))
                    .map((u) => (
                      <button
                        key={u}
                        onClick={() => addAssignee(u)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50"
                      >
                        {u}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Checklist
            </label>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 bg-white p-2 border rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`text-sm flex-1 ${task.completed ? "line-through text-gray-400" : ""}`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex space-x-2 mt-3">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="border rounded-lg px-3 py-2 flex-1 text-sm"
                  placeholder="New task..."
                />
                <button
                  onClick={handleAddTask}
                  className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkOrderModal;
