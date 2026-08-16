import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Shield, MapPin, Edit, X } from 'lucide-react';

const AccessRequests = ({ user }) => {
  const [activeTab, setActiveTab] = useState('PENDING');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  // Permissions Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editSiteLocations, setEditSiteLocations] = useState([]);

  const fetchData = async () => {
    try {
      const usersRes = await fetch(`http://localhost:8080/api/users/${user.organizationId}`);
      const locationsRes = await fetch('http://localhost:8080/api/locations');

      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        setPendingUsers(allUsers.filter(u => u.approvalStatus === 'PENDING'));
        setActiveUsers(allUsers.filter(u => u.approvalStatus !== 'PENDING'));
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
      const res = await fetch(`http://localhost:8080/api/users/${userId}/approve`, {
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

      const res = await fetch(`http://localhost:8080/api/users/${selectedUser.id}/permissions`, {
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

  return (
    <div className="flex-1 bg-gray-50 p-8 h-full overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span>Organization</span>
            <span className="mx-2">/</span>
            <span>User Management</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
          </div>
          <p className="text-gray-500 mt-2">Approve workspace access and manage user permissions.</p>
        </div>

        <div className="flex space-x-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'PENDING' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Pending Requests ({pendingUsers.length})
            {activeTab === 'PENDING' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'ACTIVE' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}
          >
            Active Members ({activeUsers.length})
            {activeTab === 'ACTIVE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role / Site Access</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

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
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
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
                  <button
                    type="button"
                    onClick={() => setEditSiteLocations([])}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Clear All (Global)
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/30">
                  {locations.map(loc => {
                    const isChecked = editSiteLocations.includes(loc.name);
                    return (
                      <label
                        key={loc.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleLocationToggle(loc.name)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-800">{loc.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select one or multiple locations. If locations selected to Pulseworks shop and warehouse, then the user will have access to all locations.
                </p>
              </div>

              <div className="pt-2 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save Permissions</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;