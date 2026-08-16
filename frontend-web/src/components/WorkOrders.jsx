import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Inbox } from 'lucide-react';

const WorkOrders = ({ user, onOpenModal }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, Filter, and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // INFINITE SCROLL STATE: How many items to render in the DOM at once
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef(null);

  const fetchWorkOrders = async () => {
    setIsLoading(true);
    try {
      // Overriding the backend limit to fetch all records safely
      const res = await fetch(`http://localhost:8080/api/workorders?orgId=${user?.organizationId}&userId=${user?.id}&limit=20000`);
      if (res.ok) {
        setWorkOrders(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch work orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      fetchWorkOrders();
    }
  }, [user]);

  // 1. Filter the massive list in the background based on search/status
  const filteredWorkOrders = workOrders.filter((wo) => {
    const ticketNo = `WO-${wo.id}`.toLowerCase();
    const title = wo.title.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = ticketNo.includes(query) || title.includes(query);
    const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 2. Only slice the amount we actually want to render in the DOM right now
  const displayedWorkOrders = filteredWorkOrders.slice(0, visibleCount);

  // 3. INTERSECTION OBSERVER: Watch the bottom of the table and load more as you scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Add 50 more rows to the screen when the user hits the bottom
        setVisibleCount((prev) => prev + 50);
      }
    }, { threshold: 0.1 });

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [displayedWorkOrders]);

  // Reset visible count if the user types a new search query
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, statusFilter]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800";
      case "HIGH": return "bg-orange-100 text-orange-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
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

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Workspace</span>
            <span className="mx-2">/</span>
            <span>Work Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders Directory</h1>
        </div>

        <button
          onClick={onOpenModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Work Order
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-t-lg border border-gray-200 border-b-0 flex gap-4 items-center shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ticket number (e.g., WO-123) or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        <div className="relative flex items-center">
          <Filter className="w-4 h-4 text-gray-500 absolute left-3" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="onHOLD">On Hold</option>
            <option value="COMPLETE">Completed</option>
            <option value="CLOSED">Closed (Archived)</option>
          </select>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm overflow-hidden flex-1">
        <div className="h-full overflow-y-auto max-h-[calc(100vh-250px)]">
          <table className="min-w-full divide-y divide-gray-200 relative">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title / Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      Loading database...
                    </div>
                  </td>
                </tr>
              ) : displayedWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No work orders found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {displayedWorkOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">WO-{wo.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/workspace/workorder/${wo.id}`}
                          className="text-sm font-bold text-gray-900 group-hover:text-blue-600 group-hover:underline block mb-1"
                        >
                          {wo.title}
                        </Link>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-md">
                          {wo.description || "No description provided."}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {wo.assignee ? (
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
                              {wo.assignee.firstName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-900 font-medium">{wo.assignee.firstName} {wo.assignee.lastName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold mr-2">U</div>
                            <span className="text-sm italic">Unassigned</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${getPriorityColor(wo.priority)}`}>
                          {wo.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(wo.status)}`}>
                          {wo.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* INVISIBLE SENSOR ROW FOR INFINITE SCROLL */}
                  {visibleCount < filteredWorkOrders.length && (
                    <tr ref={loadMoreRef}>
                      <td colSpan="5" className="px-6 py-6 text-center text-gray-400 text-xs font-medium">
                        Loading more records...
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default WorkOrders;