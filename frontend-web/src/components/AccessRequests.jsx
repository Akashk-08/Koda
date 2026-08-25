import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Shield, MapPin, Edit, X, UserX, MonitorSmartphone, UserPlus, KeyRound, Mail, Phone, Briefcase } from 'lucide-react';

const AccessRequests = ({ user }) => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [locations, setLocations] = useState([]);

  // Permissions Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editSiteLocations, setEditSiteLocations] = useState([]);

  // Shared Profile Modal State
  const [isSharedProfileModalOpen, setSharedProfileModalOpen] = useState(false);
  const [sharedModalMode, setSharedModalMode] = useState('ADD');
  const [sharedBaseEmail, setSharedBaseEmail] = useState('');
  const [sharedSelectedUserId, setSharedSelectedUserId] = useState('');
  const [sharedPin, setSharedPin] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      const usersRes = await fetch(`http://${API_URL}/api/users/${user.organizationId}`);
      const locationsRes = await fetch(`http://${API_URL}/api/locations?orgId=${user.organizationId}`);

      if (usersRes.ok) {
        const allUsers = await usersRes.json();

        setPendingUsers(allUsers.filter(u => u.approvalStatus === 'PENDING'));
        setActiveUsers(allUsers.filter(u => u.approvalStatus === 'APPROVED'));

        // Group by email
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
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.organizationId]);

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
    setIsModalOpen(true);
  };

  const handleLocationToggle = (locName) => {
    setEditSiteLocations(prev =>
      prev.includes(locName) ? prev.filter(l => l !== locName) : [...prev, locName]
    );
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    try {
      const locationString = editSiteLocations.length > 0 ? editSiteLocations.join(', ') : null;

      const res = await fetch(`http://${API_URL}/api/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          locationId: locationString
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedUser(null);
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Backend Error: ${errorData.error || res.statusText}`);
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
      alert("Network Error: Could not reach the backend server.");
    }
  };

  const handleRevokeAccess = async (targetUser = selectedUser) => {
    if (!window.confirm(`Are you sure you want to revoke workspace access for ${targetUser.firstName}?`)) return;

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
            firstName: u.firstName,
            lastName: u.lastName,
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
      alert("Network Error: Could not reach the backend server.");
    }
  };

  const totalSharedUsers = sharedGroups.reduce((acc, group) => acc + group.allSharedUsers.length, 0);

  return (
    <div className="flex-1 bg-gray-50 p-4 md:p-8 h-full overflow-y-auto font-sans pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="hidden md:flex items-center text-sm text-gray-500 mb-2">
              <span>Organization</span>
              <span className="mx-2">/</span>
              <span>User Management</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Approve workspace access and manage user permissions.</p>
          </div>

          <button
            onClick={() => openAddSharedModal()}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MonitorSmartphone className="w-4 h-4" /> Add Shared Profile
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'PENDING' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Pending Requests ({pendingUsers.length})
            {activeTab === 'PENDING' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'ACTIVE' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Active Members ({activeUsers.length})
            {activeTab === 'ACTIVE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('SHARED')}
            className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${activeTab === 'SHARED' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Shared Profiles ({totalSharedUsers})
            {activeTab === 'SHARED' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* CONTENT CONTAINER */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* ================= MOBILE VIEW (CARDS) ================= */}
          <div className="md:hidden p-4 space-y-4">

            {/* PENDING CARDS */}
            {activeTab === 'PENDING' && (
              pendingUsers.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-base font-bold text-gray-900">No pending requests</p>
                  <p className="text-xs mt-1 text-gray-400">New workspace requests will appear here.</p>
                </div>
              ) : (
                pendingUsers.map(u => (
                  <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                        {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{u.firstName} {u.lastName}</h3>
                        <span className="text-xs text-gray-400">Applied: {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" /> {u.email}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500" /> {u.siteLocation || 'Unassigned Location'}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleApproval(u.id, 'APPROVED')} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleApproval(u.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ACTIVE CARDS */}
            {activeTab === 'ACTIVE' && (
              activeUsers.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-base font-bold text-gray-900">No active members</p>
                </div>
              ) : (
                activeUsers.map(u => (
                  <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 shrink-0">
                          {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">{u.firstName} {u.lastName}</h3>
                            {u.id === user.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">You</span>}
                          </div>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        {u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                      </span>
                    </div>

                    <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 text-xs flex items-center text-gray-600">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-blue-500 shrink-0" />
                      <span>{u.siteLocation || 'Unassigned Location'}</span>
                    </div>

                    <button
                      onClick={() => openPermissionsModal(u)}
                      className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-1"
                    >
                      <Edit className="w-4 h-4" /> Manage Access & Permissions
                    </button>
                  </div>
                ))
              )
            )}

            {/* SHARED PROFILES CARDS */}
            {activeTab === 'SHARED' && (
              sharedGroups.length === 0 ? (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-base font-bold text-gray-900">No shared profiles established</p>
                  <p className="text-xs mt-1 text-gray-400">Use the button above to add shared terminal profiles.</p>
                </div>
              ) : (
                sharedGroups.map((group) => (
                  <div key={group.baseEmail} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">Terminal Identity</span>
                        <h4 className="text-sm font-extrabold text-gray-900">{group.baseEmail}</h4>
                      </div>
                      <button
                        onClick={() => openAddSharedModal(group.baseEmail)}
                        className="bg-indigo-50 text-indigo-700 p-2 rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {group.allSharedUsers.map((u) => (
                        <div key={u.id} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</span>
                                {u.id === group.baseUser.id && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold ml-1.5">Base</span>}
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                              {u.role}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 text-xs">
                            <button onClick={() => openEditSharedPinModal(u)} className="text-indigo-600 font-bold flex items-center gap-1">
                              <KeyRound className="w-3.5 h-3.5" /> PIN
                            </button>
                            <button onClick={() => openPermissionsModal(u)} className="text-blue-600 font-bold">
                              Edit Access
                            </button>
                            <button onClick={() => handleRevokeAccess(u)} className="text-red-600 font-bold">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* ================= DESKTOP VIEW (TABLE) ================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {activeTab !== 'SHARED' && (
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role / Site Access</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              )}

              <tbody className="divide-y divide-gray-100 bg-white">

                {/* PENDING TAB */}
                {activeTab === 'PENDING' && (
                  pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No pending requests at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-3">
                              {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                              <div className="text-xs text-gray-400">Applied: {new Date(u.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.siteLocation ? (
                            <span className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md w-fit">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> {u.siteLocation}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApproval(u.id, 'APPROVED')} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button onClick={() => handleApproval(u.id, 'REJECTED')} className="text-red-600 hover:bg-green-50 p-2 rounded-lg transition-colors flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {/* ACTIVE TAB */}
                {activeTab === 'ACTIVE' && (
                  activeUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No active members found.
                      </td>
                    </tr>
                  ) : (
                    activeUsers.map(u => (
                      <tr key={u.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-700 mr-3">
                              {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                              {u.id === user.id && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold ml-2">You</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                              {u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                            </span>

                            {u.siteLocation ? (
                              <span className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> {u.siteLocation}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openPermissionsModal(u)}
                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-transparent hover:border-blue-100"
                          >
                            <Edit className="w-4 h-4" /> Manage Access
                          </button>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {/* SHARED PROFILES (KIOSK) TAB */}
                {activeTab === 'SHARED' && (
                  sharedGroups.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No shared profiles established in the organization.
                      </td>
                    </tr>
                  ) : (
                    sharedGroups.map((group) => (
                      <React.Fragment key={group.baseEmail}>
                        <tr className="bg-gray-50/80 border-t-4 border-gray-100">
                          <td colSpan="4" className="px-6 py-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <MonitorSmartphone className="w-6 h-6 text-indigo-600" />
                                <div>
                                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                                    Terminal Identity: {group.baseUser.firstName} {group.baseUser.lastName}
                                  </span>
                                  <span className="font-black text-gray-900">{group.baseEmail}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openAddSharedModal(group.baseEmail)}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                              >
                                <UserPlus className="w-4 h-4" /> Add Sub-User
                              </button>
                            </div>
                          </td>
                        </tr>
                        {group.allSharedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
                            <td className="px-6 py-4 whitespace-nowrap pl-14">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                  {u.firstName.charAt(0)}{u.lastName?.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-900">{u.firstName} {u.lastName}</span>
                                {u.id === group.baseUser.id && (
                                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold ml-2">Base</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                  {u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'}
                                </span>
                                {u.siteLocation ? (
                                  <span className="flex items-center text-xs font-bold text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" /> {u.siteLocation}
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-gray-400 italic">No Site</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-500">
                              PIN Auth Required
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditSharedPinModal(u)}
                                  className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100 flex items-center gap-1"
                                >
                                  <KeyRound className="w-3.5 h-3.5" /> Reset PIN
                                </button>
                                <button
                                  onClick={() => openPermissionsModal(u)}
                                  className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                >
                                  Edit Access
                                </button>
                                <button
                                  onClick={() => handleRevokeAccess(u)}
                                  className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
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

      {/* PERMISSIONS MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Access</h2>
                <p className="text-sm text-gray-500 mt-0.5">{selectedUser.firstName} {selectedUser.lastName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSavePermissions} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">System Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditRole('USER')}
                    className={`p-3 border rounded-xl text-left transition-all ${editRole === 'USER' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-bold text-gray-900 text-sm">Member</div>
                    <div className="text-xs text-gray-500 mt-1">Standard access to assigned location data.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('ADMIN')}
                    className={`p-3 border rounded-xl text-left transition-all ${editRole === 'ADMIN' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Full workspace control and global access.</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-gray-700">Permitted Site Locations</label>
                  <button type="button" onClick={() => setEditSiteLocations([])} className="text-xs text-blue-600 hover:underline font-semibold">
                    Clear All (Global)
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/30">
                  {locations.length === 0 ? (
                    <div className="text-sm text-gray-500 italic p-2">Loading locations...</div>
                  ) : (
                    locations.map(loc => {
                      const isChecked = editSiteLocations.includes(loc.name);
                      return (
                        <label key={loc.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent'}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleLocationToggle(loc.name)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-800">{loc.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedUser.id !== user.id && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleRevokeAccess(selectedUser)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <UserX className="w-4 h-4" /> Revoke Workspace Access
                  </button>
                </div>
              )}

              <div className="pt-2 flex gap-3 shrink-0 pb-8 md:pb-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save Permissions</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARED PROFILES MODAL */}
      {isSharedProfileModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-end md:items-center justify-center md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl md:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSharedProfileModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              {sharedModalMode === 'EDIT' ? 'Reset Shared PIN' : 'Add Shared User'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {sharedModalMode === 'EDIT'
                ? 'Update the 4-digit security PIN for this worker.'
                : 'Select an existing team member to grant them shared terminal access.'}
            </p>

            <form onSubmit={handleSharedProfileSubmit} className="space-y-5">

              {sharedModalMode === 'ADD' && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Terminal Email</label>
                  <input
                    required
                    type="email"
                    placeholder="e.g. kiosk@pulseworks.com"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
                    value={sharedBaseEmail}
                    onChange={(e) => setSharedBaseEmail(e.target.value)}
                  />
                </div>
              )}

              {sharedModalMode === 'ADD' && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Select Existing User</label>
                  <select
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-pointer"
                    value={sharedSelectedUserId}
                    onChange={(e) => setSharedSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose a team member --</option>
                    {activeUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(() => {
                const u = activeUsers.find(user => user.id === sharedSelectedUserId);
                if (!u) return null;
                return (
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Name</span>
                      <span className="text-sm font-bold text-gray-900">{u.firstName} {u.lastName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Email</span>
                      <span className="text-sm font-bold text-gray-900">{u.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Location</span>
                      <span className="text-sm font-bold text-gray-900">{u.siteLocation || "Unassigned"}</span>
                    </div>
                  </div>
                );
              })()}

              {sharedSelectedUserId && (
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">4-Digit PIN</label>
                  <input
                    required type="password" maxLength={4}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl p-4 text-center tracking-[1em] text-3xl font-black focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    value={sharedPin}
                    onChange={(e) => setSharedPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!sharedSelectedUserId || sharedPin.length !== 4}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-[0.98] mt-2 pb-8 md:pb-3.5"
              >
                {sharedModalMode === 'EDIT' ? 'Save New PIN' : 'Create Shared Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;