import React, { useState, useEffect } from 'react';
import { Users, MapPin, Plus, X, UserPlus, Edit2, Trash2, Mail, Phone } from 'lucide-react';

const MyTeam = ({ user }) => {
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchData = async () => {
    try {
      const [teamsRes, locRes, usersRes] = await Promise.all([
        fetch(`http://localhost:8080/api/teams?orgId=${user.organizationId}`),
        fetch('http://localhost:8080/api/locations'),
        fetch(`http://localhost:8080/api/users/${user.organizationId}`)
      ]);

      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      if (usersRes.ok) setAvailableUsers(await usersRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // OPEN MODALS & RESET FORMS
  const openCreateModal = () => {
    setTeamName('');
    setDescription('');
    setSelectedLocation('');
    setSelectedUsers([]);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (team) => {
    setActiveTeam(team);
    setTeamName(team.name);
    setDescription(team.description || '');
    setIsEditModalOpen(true);
  };

  const openAddMemberModal = (team) => {
    setActiveTeam(team);
    setSelectedUsers([]);
    setIsAddMemberModalOpen(true);
  };

  // 1. CREATE NEW TEAM
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          description,
          locationId: selectedLocation,
          organizationId: user.organizationId,
          userIds: selectedUsers,
          requesterId: user.id
        })
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  // 2. EDIT TEAM DETAILS
  const handleEditTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8080/api/teams/${activeTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          description,
          requesterId: user.id
        })
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setActiveTeam(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update team:", error);
    }
  };

  // 3. DELETE TEAM
  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;

    try {
      const response = await fetch(`http://localhost:8080/api/teams/${teamId}?requesterId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  // 4. ADD NEW MEMBERS TO EXISTING TEAM
  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    try {
      const response = await fetch(`http://localhost:8080/api/teams/${activeTeam.id}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          requesterId: user.id
        })
      });

      if (response.ok) {
        setIsAddMemberModalOpen(false);
        setActiveTeam(null);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add members:", error);
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden font-sans">
      
      {/* LEFT SIDE: MAIN TEAMS AREA */}
      <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">My Teams</h1>
              <p className="text-gray-500 mt-1">Manage operational teams across different site locations.</p>
            </div>
            {user.role === 'ADMIN' && (
              <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
                <Plus className="w-5 h-5" /> Create Team
              </button>
            )}
          </div>

          {/* TEAMS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    {team.location && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{team.location.name}</span>
                      </span>
                    )}
                  </div>

                  {/* ADMIN EDIT/DELETE CONTROLS */}
                  {user.role === 'ADMIN' && (
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => openEditModal(team)} className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md transition-colors" title="Edit Team">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTeam(team.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-md transition-colors" title="Delete Team">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{team.name}</h3>
                <p className="text-sm text-gray-500 mb-6 h-10 line-clamp-2">{team.description}</p>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Team Members ({team.users.length})</div>
                    {user.role === 'ADMIN' && (
                      <button onClick={() => openAddMemberModal(team)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors" title="Add members">
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {team.users.map(member => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {member.firstName} {member.lastName}
                          <div className="text-xs text-gray-400 font-normal">{member.designation || 'Member'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500">No teams have been created yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: MY PEOPLE DIRECTORY */}
      <div className="w-[400px] bg-gray-50/50 border-l border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm z-10">
          <h2 className="text-xl font-bold text-gray-900">Directory</h2>
          <p className="text-sm text-gray-500 mt-1">All members in your organization</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {availableUsers.map((person) => (
            <div key={person.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Header: Avatar & Name */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{person.firstName} {person.lastName}</h3>
                  <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md mt-1 inline-block uppercase tracking-wider">
                    {person.role || 'MEMBER'}
                  </span>
                </div>
              </div>

              {/* Body: Contact Info & Location */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                  <a href={`mailto:${person.email}`} className="truncate hover:text-blue-600 hover:underline">
                    {person.email}
                  </a>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                  <span>{person.phone || 'No phone provided'}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 shrink-0" />
                  <span className="truncate">{person.location?.name || 'No assigned location'}</span>
                </div>
              </div>
              
            </div>
          ))}

          {availableUsers.length === 0 && (
            <div className="text-center p-8 text-gray-500 text-sm italic">
              No team members found.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TEAM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Team</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
                <input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="2"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Site Location</label>
                <select required value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select a location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Assign Initial Users</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {availableUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => handleUserToggle(u.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {isEditModalOpen && activeTeam && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Team Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleEditTeam} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
                <input required type="text" value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows="3"></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberModalOpen && activeTeam && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add to Team</h2>
                <p className="text-xs text-gray-500 mt-1">{activeTeam.name}</p>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleAddMembers} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Employees</label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
                  {availableUsers
                    .filter(u => !activeTeam.users.some(tu => tu.id === u.id))
                    .map(u => (
                      <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => handleUserToggle(u.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                      </label>
                    ))}
                  {availableUsers.filter(u => !activeTeam.users.some(tu => tu.id === u.id)).length === 0 && (
                    <div className="text-sm text-gray-500 p-2 text-center">All available employees are already in this team.</div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={selectedUsers.length === 0} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl transition-colors">Add Selected</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;