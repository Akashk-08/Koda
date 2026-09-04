import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Shield,
  MapPin,
  Edit,
  X,
  UserX,
  MonitorSmartphone,
  UserPlus,
  KeyRound,
  Mail,
  Route,
  AlertTriangle,
  Search,
  Globe,
} from 'lucide-react';

const CATEGORIES = [
  { label: "Annual PM", value: "ANNUAL_PREVENTIVE_MAINTENANCE" },
  { label: "Assets", value: "ASSETS" },
  { label: "Large Damage", value: "LARGE_DAMAGE" },
  { label: "Part Request", value: "PARTS_REQUEST" },
  { label: "Project/Upgrade", value: "PROJECT_UPGRADE" },
  { label: "Six months PM", value: "SIX_MONTH_PREVENTIVE_MAINTENANCE" },
  { label: "Support Request", value: "SUPPORT_REQUEST" },
  { label: "Checklists", value: "WEEKLY_MONTHLY_CHECKLISTS" },
];

const AccessRequests = ({ user }) => {
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [dbError, setDbError] = useState(null);

  // Permissions Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editSiteLocations, setEditSiteLocations] = useState([]);
  const [editAutoCategories, setEditAutoCategories] = useState([]);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Shared Profile Modal State
  const [isSharedProfileModalOpen, setSharedProfileModalOpen] = useState(false);
  const [sharedModalMode, setSharedModalMode] = useState('ADD');
  const [sharedBaseEmail, setSharedBaseEmail] = useState('');
  const [sharedSelectedUserId, setSharedSelectedUserId] = useState('');
  const [sharedPin, setSharedPin] = useState('');

  const [isTerminalDropdownOpen, setIsTerminalDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const terminalRef = useRef(null);
  const userSelectRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    if (!user?.organizationId) return;

    try {
      const [usersRes, locationsRes] = await Promise.all([
        fetch(`http://${API_URL}/api/users?orgId=${user.organizationId}`),
        fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`)
      ]);

      if (!usersRes.ok) {
        const errorText = await usersRes.text();
        setDbError(`Status Code ${usersRes.status}: ${errorText}`);
        return;
      }

      setDbError(null);
      const allUsers = await usersRes.json();

      if (Array.isArray(allUsers)) {
        setPendingUsers(allUsers.filter(u => u.approvalStatus === 'PENDING'));
        setActiveUsers(allUsers.filter(u => u.approvalStatus === 'APPROVED'));

        const groups = {};
        allUsers.filter(u => u.approvalStatus === 'APPROVED').forEach(u => {
          if (!groups[u.email]) groups[u.email] = [];
          groups[u.email].push(u);
        });

        const shared = Object.keys(groups)
          .map(email => {
            const sortedUsers = groups[email].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return {
              baseEmail: email,
              baseUser: sortedUsers[0],
              allSharedUsers: sortedUsers
            };
          })
          .filter(group => group.allSharedUsers.length > 1);

        setSharedGroups(shared);
      }

      if (locationsRes.ok) {
        setLocations(await locationsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setDbError(error.message || "Network error occurred connecting to the backend.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.organizationId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (terminalRef.current && !terminalRef.current.contains(event.target)) {
        setIsTerminalDropdownOpen(false);
      }
      if (userSelectRef.current && !userSelectRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApproval = async (userId, status) => {
    try {
      const res = await fetch(`http://${API_URL}/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const openPermissionsModal = (targetUser) => {
    setSelectedUser(targetUser);
    setEditRole(targetUser.role || 'USER');

    let initialLocs = [];
    if (targetUser.siteLocation) {
      initialLocs = targetUser.siteLocation.includes(',')
        ? targetUser.siteLocation.split(',').map(s => s.trim())
        : [targetUser.siteLocation];
    }
    setEditSiteLocations(initialLocs);
    setEditAutoCategories(targetUser.autoAssignCategories || []);
    setLocationSearchQuery("");
    setIsModalOpen(true);
  };

  const handleLocationToggle = (locName) => {
    setEditSiteLocations(prev =>
      prev.includes(locName) ? prev.filter(l => l !== locName) : [...prev, locName]
    );
  };

  const handleAutoCategoryToggle = (categoryValue) => {
    setEditAutoCategories(prev =>
      prev.includes(categoryValue) ? prev.filter(c => c !== categoryValue) : [...prev, categoryValue]
    );
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const locationString = editSiteLocations.length > 0 ? editSiteLocations.join(', ') : null;

      const res = await fetch(`http://${API_URL}/api/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          locationId: locationString,
          autoAssignCategories: editAutoCategories
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setSelectedUser(null);
        await fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Backend Error: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
      alert("Network Error: Could not reach the backend server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeAccess = async (targetUser = selectedUser) => {
    if (!window.confirm(`Revoke workspace access for ${targetUser.firstName} ${targetUser.lastName}?`)) return;

    await handleApproval(targetUser.id, 'REJECTED');
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const openAddSharedModal = (prefilledEmail = '') => {
    setSharedModalMode('ADD');
    setSharedBaseEmail(prefilledEmail);
    setSharedSelectedUserId('');
    setSharedPin('');
    setSharedProfileModalOpen(true);
  };

  const openEditSharedPinModal = (userToEdit) => {
    setSharedModalMode('EDIT');
    setSharedBaseEmail(userToEdit.email);
    setSharedSelectedUserId(userToEdit.id);
    setSharedPin('');
    setSharedProfileModalOpen(true);
  };

  const handleSharedProfileSubmit = async (e) => {
    e.preventDefault();
    const u = activeUsers.find(usr => usr.id === sharedSelectedUserId);
    if (!u) return;

    try {
      if (sharedModalMode === 'ADD') {
        const res = await fetch(`http://${API_URL}/api/auth/add-shared-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseEmail: sharedBaseEmail,
            userId: sharedSelectedUserId,
            pin: sharedPin
          })
        });
        if (res.ok) {
          setSharedProfileModalOpen(false);
          fetchData();
        } else {
          const errorData = await res.json().catch(() => ({}));
          alert(`Failed to add profile: ${errorData.error || res.statusText}`);
        }
      } else {
        const res = await fetch(`http://${API_URL}/api/users/${u.id}/pin`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: sharedPin })
        });

        if (res.ok) {
          setSharedProfileModalOpen(false);
          fetchData();
        } else {
          alert("Failed to update PIN.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Could not reach backend server.");
    }
  };

  const renderLocationBadges = (locString) => {
    if (!locString) {
      return <span className="text-xs text-slate-400 italic font-medium">Unassigned</span>;
    }

    const parsedLocs = locString.includes(',')
      ? locString.split(',').map(s => s.trim()).filter(Boolean)
      : [locString.trim()];

    const hasShop = parsedLocs.some(l => l.toLowerCase().includes('shop'));
    const hasWarehouse = parsedLocs.some(l => l.toLowerCase().includes('warehouse'));
    const isGlobal = (hasShop && hasWarehouse) || parsedLocs.length >= 6;

    if (isGlobal) {
      return (
        <div className="flex items-center gap-1.5 relative group cursor-help">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Global Access
          </span>
          <span className="text-[11px] font-bold text-slate-400">({parsedLocs.length} sites)</span>
          
          <div className="absolute bottom-full left-0 mb-2 w-max max-w-xs p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <ul className="text-left space-y-1">
              {parsedLocs.map((loc, i) => (
                <li key={i} className="truncate">• {loc}</li>
              ))}
            </ul>
            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      );
    }

    if (parsedLocs.length <= 2) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {parsedLocs.map(loc => (
            <div key={loc} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-slate-800 text-[11px] font-bold max-w-[180px] shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">{loc}</span>
            </div>
          ))}
        </div>
      );
    }

    const displayedLocs = parsedLocs.slice(0, 2);
    const remainingCount = parsedLocs.length - 2;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {displayedLocs.map(loc => (
          <div key={loc} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-slate-800 text-[11px] font-bold max-w-[150px] shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{loc}</span>
          </div>
        ))}
        
        <div className="relative group cursor-help">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-black text-[11px] shadow-2xs hover:bg-blue-100 transition-colors">
            +{remainingCount} more
          </span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <ul className="text-left space-y-1">
              {parsedLocs.slice(2).map((loc, i) => (
                <li key={i} className="truncate">• {loc}</li>
              ))}
            </ul>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      </div>
    );
  };

  const totalSharedUsers = sharedGroups.reduce((acc, group) => acc + group.allSharedUsers.length, 0);
  const uniqueEmails = [...new Set(activeUsers.map(u => u.email))];

  const getAvailableUsersForTerminal = () => {
    if (!sharedBaseEmail) return activeUsers;
    const existingUsersInGroup = sharedGroups.find(g => g.baseEmail === sharedBaseEmail)?.allSharedUsers || [];
    const existingNames = new Set(existingUsersInGroup.map(u => `${u.firstName} ${u.lastName}`));
    return activeUsers.filter(u => !existingNames.has(`${u.firstName} ${u.lastName}`));
  };

  const sortedLocations = [...locations].sort((a, b) => {
    const aSelected = editSiteLocations.includes(a.name);
    const bSelected = editSiteLocations.includes(b.name);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredLocations = sortedLocations.filter(loc =>
    loc.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  const filterUsersList = (list) => {
    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase().trim();
    return list.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.siteLocation?.toLowerCase().includes(q)
    );
  };

  return (
    <div className="flex-1 bg-[#f8fafc] p-4 md:p-8 h-full overflow-y-auto font-sans pb-28 md:pb-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HERO HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[28px] border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              <span>Workspace Admin</span>
              <span>•</span>
              <span className="text-blue-600">Access & Routing</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
              Configure multi-site permissions, terminal kiosk sharing, and ticket auto-routing rules.
            </p>
          </div>

          <button
            onClick={() => openAddSharedModal()}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <MonitorSmartphone className="w-4 h-4 text-indigo-400" /> Add Shared Profile
          </button>
        </div>

        {/* ERROR BANNER */}
        {dbError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4 shadow-2xs">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="w-full min-w-0">
              <h3 className="text-sm font-black text-rose-900 tracking-tight">Server Request Rejected</h3>
              <p className="text-xs text-rose-800 mt-1 font-medium">{dbError}</p>
            </div>
          </div>
        )}

        {/* CONTROLS BAR: TABS & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
          <div className="flex space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'ACTIVE'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              Active Members
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {activeUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'PENDING'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Pending Requests
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingUsers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('SHARED')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'SHARED'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MonitorSmartphone className="w-4 h-4" />
              Shared Terminals
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'SHARED' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {totalSharedUsers}
              </span>
            </button>
          </div>

          {activeTab !== 'SHARED' && (
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search member, email, site..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* MAIN DATA CONTAINER */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] shadow-2xs overflow-hidden">

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              {activeTab !== 'SHARED' && (
                <thead className="bg-slate-50/75 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role & Site Access</th>
                    {activeTab === 'ACTIVE' && <th className="px-6 py-4">Auto-Routing Rules</th>}
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
              )}

              <tbody className="divide-y divide-slate-100 bg-white">
                {activeTab === 'ACTIVE' && (
                  filterUsersList(activeUsers).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-slate-400 font-bold text-sm">
                        No active members matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filterUsersList(activeUsers).map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shadow-2xs group-hover:border-blue-300 transition-colors shrink-0">
                              {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">{u.firstName} {u.lastName}</span>
                                {u.id === user.id && (
                                  <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.2 rounded-md tracking-wider">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400 font-medium">{u.designation || "Team Member"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {u.role === 'ADMIN' && <Shield className="w-3 h-3 text-purple-600" />}
                              {u.role === 'ADMIN' ? 'Administrator' : 'Team Member'}
                            </span>
                            {renderLocationBadges(u.siteLocation)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                            {u.autoAssignCategories && u.autoAssignCategories.length > 0 ? (
                              u.autoAssignCategories.map(cat => (
                                <span key={cat} className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-2xs">
                                  {cat.replace(/_/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic font-medium">No routing rules</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                          {u.email}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openPermissionsModal(u)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Manage Setup
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === 'PENDING' && (
                  filterUsersList(pendingUsers).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-slate-400 font-bold text-sm">
                        No pending requests.
                      </td>
                    </tr>
                  ) : (
                    filterUsersList(pendingUsers).map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-xs shrink-0">
                              {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{u.firstName} {u.lastName}</div>
                              <div className="text-xs text-slate-400">Applied: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {renderLocationBadges(u.siteLocation)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                          {u.email}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproval(u.id, 'APPROVED')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleApproval(u.id, 'REJECTED')}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === 'SHARED' && (
                  sharedGroups.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-slate-400 font-bold text-sm">
                        No shared terminal identities established.
                      </td>
                    </tr>
                  ) : (
                    sharedGroups.map((group) => (
                      <React.Fragment key={group.baseEmail}>
                        <tr className="bg-slate-50/80 border-t border-slate-200">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200 shadow-2xs">
                                  <MonitorSmartphone className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                                    Terminal Identity ({group.baseUser.firstName} {group.baseUser.lastName})
                                  </span>
                                  <span className="font-black text-slate-900 text-xs">{group.baseEmail}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openAddSharedModal(group.baseEmail)}
                                className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-4 py-2 rounded-xl shadow-2xs hover:bg-indigo-50 transition-colors flex items-center gap-1.5 active:scale-95"
                              >
                                <UserPlus className="w-3.5 h-3.5" /> Add Sub-User
                              </button>
                            </div>
                          </td>
                        </tr>
                        {group.allSharedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors border-t border-slate-100 group">
                            <td className="px-6 py-4 pl-16">
                              <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xs shadow-2xs">
                                  {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                                </div>
                                <span className="font-black text-slate-900 text-sm">{u.firstName} {u.lastName}</span>
                                {u.id === group.baseUser.id && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-black uppercase tracking-wider ml-1">Base</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {u.role === 'ADMIN' && <Shield className="w-3 h-3 text-purple-600" />}
                                  {u.role === 'ADMIN' ? 'Administrator' : 'Shared Member'}
                                </span>
                                {renderLocationBadges(u.siteLocation)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                              PIN Auth Required
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditSharedPinModal(u)}
                                  className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-indigo-100 flex items-center gap-1 font-bold text-xs"
                                >
                                  <KeyRound className="w-3.5 h-3.5" /> PIN
                                </button>
                                <button
                                  onClick={() => openPermissionsModal(u)}
                                  className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-blue-100 font-bold text-xs"
                                >
                                  Edit Access
                                </button>
                                <button
                                  onClick={() => handleRevokeAccess(u)}
                                  className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-rose-100 font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* MODERN PERMISSIONS & ROUTING MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end md:items-center justify-center z-50 md:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] md:rounded-[28px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
            <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-100 bg-white shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1">
                  Access & Security Configuration
                </span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              
              {/* SYSTEM ROLE */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">System Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('USER')}
                    className={`p-4 rounded-2xl text-left transition-all border-2 ${
                      editRole === 'USER'
                        ? 'border-blue-600 bg-blue-50/40 shadow-2xs'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-sm">Member</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                      Restricted to checked permitted site locations only.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('ADMIN')}
                    className={`p-4 rounded-2xl text-left transition-all border-2 ${
                      editRole === 'ADMIN'
                        ? 'border-purple-600 bg-purple-50/40 shadow-2xs'
                        : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-purple-600" /> Administrator
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                      Full workspace control with unrestricted access to all assets and sites.
                    </div>
                  </button>
                </div>
              </div>

              {/* PERMITTED SITES */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                      Permitted Site Locations ({editSiteLocations.length} selected)
                    </label>
                    <p className="text-[11px] font-medium text-slate-500">
                      Select all client sites this user is authorized to manage or view.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditSiteLocations([])}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                  >
                    Clear All
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 custom-scrollbar divide-y divide-slate-100">
                  {locations.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-4 text-center">Loading locations...</div>
                  ) : filteredLocations.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-4 text-center">No locations match search.</div>
                  ) : (
                    filteredLocations.map(loc => {
                      const isChecked = editSiteLocations.includes(loc.name);
                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLocationToggle(loc.name)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 bg-white shrink-0"
                          />
                          <span className={`text-xs font-bold truncate ${isChecked ? 'text-blue-950' : 'text-slate-700'}`}>
                            {loc.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AUTOMATIC ROUTING */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                      <Route className="w-3.5 h-3.5" /> Ticket Auto-Routing Rules
                    </label>
                    <p className="text-[11px] font-medium text-slate-500">
                      Automatically route new tickets matching these categories to this technician.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditAutoCategories([])}
                    className="text-[11px] text-emerald-800 font-black uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                  >
                    Clear Rules
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORIES.map(cat => {
                    const isChecked = editAutoCategories.includes(cat.value);
                    return (
                      <label
                        key={cat.value}
                        className={`flex items-center gap-2.5 p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-500 shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAutoCategoryToggle(cat.value)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0"
                        />
                        <span className={`text-xs font-black uppercase tracking-wider truncate ${
                          isChecked ? 'text-emerald-950' : 'text-slate-600'
                        }`}>
                          {cat.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* REVOKE ACCESS */}
              {selectedUser.id !== user.id && (
                <button
                  type="button"
                  onClick={() => handleRevokeAccess(selectedUser)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-xs font-black text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-2xl transition-colors shadow-2xs"
                >
                  <UserX className="w-4 h-4" /> Revoke Workspace Access
                </button>
              )}
            </form>

            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex gap-3 shrink-0 pb-8 md:pb-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSavePermissions}
                type="button"
                className="flex-1 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARED PROFILE MODAL - 2026 REDESIGN */}
      {isSharedProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 md:p-10 max-w-lg w-full shadow-2xl relative border border-slate-100 overflow-visible flex flex-col transform transition-all">
            
            <button
              onClick={() => setSharedProfileModalOpen(false)}
              className="absolute top-6 right-6 p-2.5 bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs">
                <MonitorSmartphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {sharedModalMode === 'EDIT' ? 'Reset Terminal PIN' : 'Link Shared Profile'}
              </h2>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed font-medium">
                {sharedModalMode === 'EDIT'
                  ? 'Update the 4-digit security PIN for this shared terminal profile.'
                  : 'Link a team member to a terminal kiosk. Site permissions inherit automatically.'}
              </p>
            </div>

            <form onSubmit={handleSharedProfileSubmit} className="space-y-6 flex-1 flex flex-col">
              {sharedModalMode === 'ADD' && (
                <div className="space-y-5">
                  <div className="relative" ref={terminalRef}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Terminal Identity Email
                    </label>
                    <div
                      onClick={() => setIsTerminalDropdownOpen(!isTerminalDropdownOpen)}
                      className="w-full p-4 bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold cursor-pointer flex justify-between items-center transition-all shadow-2xs"
                    >
                      <span className={sharedBaseEmail ? "text-slate-900" : "text-slate-400"}>
                        {sharedBaseEmail || "-- Select terminal email --"}
                      </span>
                    </div>

                    {isTerminalDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1">
                        {activeUsers.map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSharedBaseEmail(u.email);
                              setSharedSelectedUserId('');
                              setIsTerminalDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-50/80 cursor-pointer rounded-xl flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <MonitorSmartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span className="text-sm font-bold text-slate-800 truncate">{u.email}</span>
                            </div>
                            <span className="text-xs font-black text-slate-400 ml-2 shrink-0">{u.firstName} {u.lastName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={userSelectRef}>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                      Team Member to Link
                    </label>
                    <div
                      onClick={() => sharedBaseEmail && setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className={`w-full p-4 border rounded-2xl text-sm font-bold flex justify-between items-center transition-all shadow-2xs ${
                        !sharedBaseEmail
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                          : "bg-slate-50/80 border-slate-200 hover:border-slate-300 cursor-pointer text-slate-900"
                      }`}
                    >
                      <span>
                        {sharedSelectedUserId
                          ? (() => {
                              const u = activeUsers.find(u => u.id === sharedSelectedUserId);
                              return u ? `${u.firstName} ${u.lastName} (${u.email})` : "-- Select a team member --";
                            })()
                          : "-- Select a team member --"}
                      </span>
                    </div>

                    {isUserDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 space-y-1">
                        {getAvailableUsersForTerminal().map(u => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSharedSelectedUserId(u.id);
                              setIsUserDropdownOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-50/80 cursor-pointer rounded-xl flex items-center justify-between transition-colors"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-slate-900 truncate">{u.firstName} {u.lastName}</span>
                              <span className="text-xs text-slate-400 font-medium truncate">{u.email}</span>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase shrink-0 ml-2">{u.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sharedSelectedUserId && (
                <div className="pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 text-center">
                    Assign 4-Digit Security PIN
                  </label>
                  <input
                    required
                    type="password"
                    maxLength={4}
                    className="w-full border border-slate-200 bg-slate-50/80 rounded-2xl p-4 text-center tracking-[1em] text-3xl font-black outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 shadow-inner"
                    value={sharedPin}
                    onChange={(e) => setSharedPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                  />
                </div>
              )}

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={!sharedSelectedUserId || sharedPin.length !== 4}
                  className="w-full font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm tracking-wide"
                >
                  {sharedModalMode === 'EDIT' ? 'Save New PIN' : 'Confirm & Link Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;