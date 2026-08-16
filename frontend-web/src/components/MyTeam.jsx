import React, { useState, useEffect } from 'react';
import { Plus, Mail, Phone, MapPin, Users, Shield, UserPlus, Building, X, Trash2, Check, User } from 'lucide-react';

const MyTeam = ({ user }) => {
  const [activeTab, setActiveTab] = useState('directory');
  const [orgUsers, setOrgUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Security Check
  const isAdmin = user?.role === 'ADMIN';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (user?.organizationId) {
        const usersRes = await fetch(`http://localhost:8080/api/users/${user.organizationId}`);
        if (usersRes.ok) setOrgUsers(await usersRes.json());

        const teamsRes = await fetch(`http://localhost:8080/api/teams?orgId=${user.organizationId}`);
        if (teamsRes.ok) setTeams(await teamsRes.json());
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

  // 1. DIRECTORY FILTER: Admins see everyone (including pending). Regular users only see approved.
  const visibleUsers = orgUsers.filter(member => {
    if (member.approvalStatus === 'PENDING') {
      return isAdmin;
    }
    return true;
  });

  // 2. ASSIGNMENT FILTER: Strictly ONLY approved users.
  const approvedUsers = orgUsers.filter(member => member.approvalStatus !== 'PENDING');

  // 3. MY TEAMS FILTER: Filter teams to only show ones where the current user is a member
  const myTeams = teams.filter(team => team.users?.some(u => u.id === user?.id));

  // Determine which list of teams to display based on the active tab
  const displayTeams = activeTab === 'my_teams' ? myTeams : teams;

  return (
    <main className="flex-1 flex flex-col h-full bg-gray-50 p-8 overflow-y-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <span>Organization</span>
          <span className="mx-2">/</span>
          <span>My Team</span>
        </div>

        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Organization Directory</h1>

          {/* ONLY ADMINS SEE THE CREATION BUTTONS */}
          {isAdmin && (
            activeTab === 'directory' ? (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
                <UserPlus className="w-4 h-4" /> Invite User
              </button>
            ) : (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
                <Plus className="w-4 h-4" /> Create Team
              </button>
            )
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-8 mt-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'directory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" /> People Directory
            </div>
          </button>

          <button
            onClick={() => setActiveTab('my_teams')}
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'my_teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
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
            className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'teams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
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
        /* DIRECTORY VIEW */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1">
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
                      <p className="text-sm mt-1">Invite members to your organization to see them here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleUsers.map((member) => (
                  <tr key={member.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                          {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{member.firstName} {member.lastName}</div>
                          <div className="flex items-center mt-1">
                            {member.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                                <Shield className="w-3 h-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                User
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center text-sm text-gray-600 font-medium">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {member.phoneNumber || <span className="italic">No phone provided</span>}
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
                        {member.approvalStatus || 'APPROVED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* SHARED TEAMS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
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
                <button className="mt-6 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
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
                        team.users.slice(0, 4).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-black/5 z-10">
                            U{i + 1}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
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
          onClose={() => setIsTeamModalOpen(false)}
          onRefresh={fetchData}
          isAdmin={isAdmin}
        />
      )}
    </main>
  );
};

//  TEAM MANAGEMENT MODAL COMPONENT 
const TeamManagementModal = ({ team, orgUsers, onClose, onRefresh, isAdmin }) => {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [memberIds, setMemberIds] = useState(team.users?.map(u => u.id) || []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleMember = (userId) => {
    if (!isAdmin) return;
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/teams/${team.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, memberIds })
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        alert("Failed to update team");
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
      const res = await fetch(`http://localhost:8080/api/teams/${team.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'Manage Team' : 'Team Details'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-200/50 hover:bg-gray-200 p-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5">

          {/* Team Name - Full Width */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Team Name</label>
            {isAdmin ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            ) : (
              <div className="w-full bg-gray-50 text-gray-900 font-medium rounded-lg p-3 text-sm border border-transparent">
                {name}
              </div>
            )}
          </div>

          {/* Site Location - Full Width */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Site Location</label>
            <div className="relative flex items-center w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-9 pr-3 text-sm cursor-default">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-gray-700 font-medium break-words w-full">
                {team.location?.name || "Global / Unassigned"}
              </span>
            </div>
          </div>

          {/* Description - Auto-resizes based on content or Admin edit state */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
            {isAdmin ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this team..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px] resize-y"
              />
            ) : (
              <div className="w-full bg-gray-50 text-gray-900 rounded-lg p-3 text-sm whitespace-pre-wrap border border-transparent min-h-[44px]">
                {description ? description : <span className="text-gray-400 italic">No description provided.</span>}
              </div>
            )}
          </div>

          {/* Team Members List */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gray-700">Team Members</label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{memberIds.length} Selected</span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {orgUsers.map(user => {
                const isSelected = memberIds.includes(user.id);
                if (!isAdmin && !isSelected) return null;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`flex items-center justify-between p-3 transition-colors ${isAdmin
                        ? `cursor-pointer ${isSelected ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}`
                        : 'bg-white cursor-default'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                );
              })}
              {!isAdmin && memberIds.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500 italic">No members assigned to this team yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          {isAdmin ? (
            <>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Team
              </button>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2 text-sm text-gray-600 hover:bg-gray-200 font-bold rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button onClick={onClose} className="px-5 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors">
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