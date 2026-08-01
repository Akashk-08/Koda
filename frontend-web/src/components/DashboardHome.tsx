import React from "react";
import { Link } from "react-router-dom";

// Interfaces
interface WorkOrder {
  id: number;
  title: string;
  description: string;
  category?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "onHOLD" | "COMPLETE" | "REVIEW" | "CLOSED";
  createdAt: string;
  assignee?: { id: string; firstName: string; lastName: string } | null;
}

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

const DashboardHome = ({
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
            className="border-transparent text-gray-500 hover:text-gray-700 whitespace-nowrap pb-3 border-b-2 font-medium text-sm"
          >
            AI Search
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
                      to={`/workorder/${wo.id}`}
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

export default DashboardHome;
