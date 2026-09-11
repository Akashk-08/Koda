import React, { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MapPin, Users, Shield, Building, X, Trash2, Check, User, Briefcase } from 'lucide-react';

const MyTeam = ({ user }) => {
  const [activeTab, setActiveTab] = useState('directory');
  const [orgUsers, setOrgUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  // Modal State
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Security Check
  const isAdmin = user?.role === 'ADMIN';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (user?.organizationId) {
        const [usersRes, teamsRes, locsRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${user.organizationId}`),
          fetch(`${API_URL}/api/teams?orgId=${user.organizationId}`),
          fetch(`${API_URL}/api/locations?orgId=${user.organizationId}`)
        ]);

        if (usersRes.ok) {
          const rawUsers = await usersRes.json();
          const validUsers = rawUsers.filter(u => u.approvalStatus !== 'REJECTED');
          setOrgUsers(validUsers);
        }
        if (teamsRes.ok) setTeams(await teamsRes.json());
        if (locsRes.ok) setLocations(await locsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleOpenTeamModal = (team) => {
    setSelectedTeam(team);
    setIsTeamModalOpen(true);
  };

  const uniqueOrgUsers = Array.from(
    new Map(orgUsers.map(member => [member.id, member])).values()
  );

  const visibleUsers = uniqueOrgUsers.filter(member => {
    if (member.approvalStatus === 'PENDING') {
      return isAdmin;
    }
    return true;
  });

  const approvedUsers = uniqueOrgUsers.filter(member => member.approvalStatus !== 'PENDING');
  const myTeams = teams.filter(team => team.users?.some(u => u.id === user?.id));
  const displayTeams = activeTab === 'my_teams' ? myTeams : teams;

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-4 md:p-8 overflow-y-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>Organization</span>
          <span className="mx-2">/</span>
          <span>My Team</span>
        </div>

        <div className="flex justify-between items-end">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Organization Directory</h1>

          {isAdmin && activeTab === 'teams' && (
            <button
              onClick={() => handleOpenTeamModal({ name: '', description: '', users: [], locationId: '' })}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Team
            </button>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 md:gap-8 mt-8 border-b border-gray-200 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'directory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" /> People Directory
            </div>
          </button>

          <button
            onClick={() => setActiveTab('my_teams')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'my_teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4" /> My Teams
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-[10px] ml-1">
                {myTeams.length}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4" /> Operational Teams
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-[10px] ml-1">
                {teams.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {isLoading ? (
        <div className="flex justify-center py-32 text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'directory' ? (
        <>
          {/* MOBILE DIRECTORY VIEW */}
          <div className="md:hidden space-y-5 pb-20">
            {visibleUsers.length === 0 ? (
              <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-900">No users found</p>
                <p className="text-sm mt-1">Users added to your organization will appear here.</p>
              </div>
            ) : (
              visibleUsers.map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                  <div className={`h-2 w-full ${member.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-500 to-purple-700' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`}></div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex gap-4">
                        <div className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-gray-100 ${member.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </div>
                        <div className="flex flex-col justify-center">
                          <h3 className="text-lg font-extrabold text-gray-900 leading-none mb-1.5">
                            {member.firstName} {member.lastName}
                          </h3>
                          <div className="flex items-center text-sm font-bold text-gray-500">
                            <Briefcase className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {member.designation || (member.role === 'ADMIN' ? 'System Administrator' : 'Team Member')}
                          </div>
                        </div>
                      </div>

                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm border ${member.approvalStatus === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        {member.approvalStatus === 'PENDING' ? 'PENDING' : 'ACTIVE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center text-sm text-gray-700 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mr-3 shrink-0 shadow-sm text-gray-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mr-3 shrink-0 shadow-sm text-gray-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        {member.phoneNumber || <span className="italic text-gray-400 font-normal">No phone provided</span>}
                      </div>
                      <div className="flex items-center text-sm text-gray-700 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mr-3 shrink-0 shadow-sm text-blue-500">
                          <MapPin className="w-4 h-4" />
                        </div>
                        {member.siteLocation || <span className="italic text-gray-400 font-normal">Unassigned Location</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP DIRECTORY VIEW (Table) */}
          <div className="hidden md:flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex-col">
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Site Location</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibleUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium text-gray-900">No users found</p>
                          <p className="text-sm mt-1">Users added to your organization will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleUsers.map((member) => (
                      <tr key={member.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-gray-200 shadow-sm">
                              {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                            </div>
                            <div className="ml-4 flex flex-col">
                              <span className="text-sm font-bold text-gray-900 leading-tight">{member.firstName} {member.lastName}</span>
                              <span className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center">
                                <Briefcase className="w-3 h-3 mr-1" />
                                {member.designation || (member.role === 'ADMIN' ? 'System Administrator' : 'Team Member')}
                              </span>
                              <div className="flex items-center mt-1.5">
                                {member.role === 'ADMIN' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                                    <Shield className="w-3 h-3" /> Admin Access
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                    Standard User
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-sm text-gray-700 font-medium">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {member.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {member.phoneNumber || <span className="italic font-normal">No phone provided</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700 font-medium">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            {member.siteLocation || <span className="text-gray-400 italic font-normal">Unassigned</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${member.approvalStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                            {member.approvalStatus === 'PENDING' ? 'PENDING' : 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* SHARED TEAMS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {displayTeams.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'my_teams' ? <User className="w-8 h-8 text-gray-400" /> : <Building className="w-8 h-8 text-gray-400" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {activeTab === 'my_teams' ? "Not in any teams" : "No operational teams"}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm text-center">
                {activeTab === 'my_teams'
                  ? "You haven't been assigned to any operational teams yet."
                  : "Create your first team to group members together."}
              </p>

              {isAdmin && activeTab === 'teams' && (
                <button
                  onClick={() => handleOpenTeamModal({ name: '', description: '', users: [], locationId: '' })}
                  className="mt-6 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Team
                </button>
              )}
            </div>
          ) : (
            displayTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => handleOpenTeamModal(team)}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-700 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>

                <div className="flex justify-between items-start gap-4 mb-5 w-full">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 flex justify-end min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200/60 shadow-sm max-w-full">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{team.location?.name || "Global"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{team.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{team.description || "Operational team."}</p>
                </div>

                <div className="flex justify-between items-end pt-6 mt-6 border-t border-gray-100">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{team.users?.length || 0} Members</span>
                    <div className="flex -space-x-2.5">
                      {(!team.users || team.users.length === 0) ? (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center z-10">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      ) : (
                        team.users.slice(0, 4).map((memberObj, i) => (
                          <div key={memberObj.id || i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-black/5 z-10" title={`${memberObj.firstName || 'User'} ${memberObj.lastName || ''}`}>
                            {memberObj.firstName?.charAt(0) || 'U'}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit/Manage Team Modal */}
      {isTeamModalOpen && selectedTeam && (
        <TeamManagementModal
          team={selectedTeam}
          orgUsers={approvedUsers}
          locations={locations}
          onClose={() => setIsTeamModalOpen(false)}
          onRefresh={fetchData}
          isAdmin={isAdmin}
          user={user}
        />
      )}
    </main>
  );
};

// TEAM MANAGEMENT MODAL COMPONENT
const TeamManagementModal = ({ team, orgUsers, locations, onClose, onRefresh, isAdmin, user }) => {
  const [name, setName] = useState(team.name || '');
  const [description, setDescription] = useState(team.description || '');
  const [locationId, setLocationId] = useState(team.locationId || '');

  const [memberIds, setMemberIds] = useState(() => {
    if (!team.users) return [];
    return team.users.map(u => (typeof u === 'string' ? u : u.id));
  });

  const [isSaving, setIsSaving] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const toggleMember = (userId) => {
    if (!isAdmin) return;
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const method = team.id ? 'PUT' : 'POST';
      const url = team.id
        ? `${API_URL}/api/teams/${team.id}`
        : `${API_URL}/api/teams`;

      const payload = {
        name,
        description,
        userIds: memberIds,
        locationId: locationId || null,
        organizationId: user?.organizationId,
        requesterId: user?.id
      };

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert("Failed to save team");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/teams/${team.id}?requesterId=${user?.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-4 transition-all duration-300">
      <div className="bg-white w-full max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">

        <div className="px-6 py-5 flex justify-between items-center bg-white border-b border-gray-100 relative z-10">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {isAdmin ? (team.id ? 'Edit Team' : 'Create New Team') : 'Team Details'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Manage this team's details and assignments</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Team Name</label>
            {isAdmin ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maintenance Alpha"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
              />
            ) : (
              <div className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl p-3.5 text-sm border border-gray-100">
                {name}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Site Location</label>
            {isAdmin ? (
              <div className="relative">
                <MapPin className="h-4 w-4 text-gray-400 absolute left-4 top-3.5 pointer-events-none" />
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 pl-10 text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Global / Unassigned</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm cursor-default w-full sm:w-auto">
                <MapPin className="h-4 w-4 text-gray-400 mr-2.5" />
                <span className="text-gray-700 font-semibold truncate">
                  {team.location?.name || "Global / Unassigned"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
            {isAdmin ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this team do?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px] resize-y placeholder-gray-400"
              />
            ) : (
              <div className="w-full bg-gray-50 text-gray-900 rounded-xl p-3.5 text-sm whitespace-pre-wrap border border-gray-100 min-h-[60px] font-medium">
                {description ? description : <span className="text-gray-400 italic font-medium">No description provided.</span>}
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Assign Members</label>
              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md shadow-sm">
                {memberIds.length} Selected
              </span>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[280px] overflow-y-auto bg-white shadow-inner">
              {orgUsers.map(user => {
                const isSelected = memberIds.includes(user.id);
                if (!isAdmin && !isSelected) return null;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center justify-between p-3.5 transition-all ${isAdmin
                      ? `cursor-pointer ${isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-gray-50'}`
                      : 'bg-white cursor-default'
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-gray-500 font-medium truncate">{user.email}</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pr-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md' : 'border-gray-300 bg-white'}`}>
                          {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isAdmin && memberIds.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500 italic font-medium bg-gray-50">
                  No members are assigned to this team yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/80 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pb-8 sm:pb-5">
          {isAdmin ? (
            <>
              {team.id ? (
                <button
                  onClick={handleDelete}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete Team
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 font-bold rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex justify-center items-center"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 text-sm bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold rounded-xl transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MyTeam;