/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Briefcase, Shield, Users, Edit3, X, Home } from 'lucide-react';

const MyProfile = ({ user, onUpdateUser }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [myTeams, setMyTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const API_URL = "192.168.1.92:8080";

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    siteLocation: currentUser?.siteLocation || '',
    homeAddress: currentUser?.homeAddress || '',
    designation: currentUser?.designation || ''
  });

  // FETCH FRESH USER DATA FROM DATABASE ON LOAD
  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (!user?.id || !user?.organizationId) return;
      try {
        const res = await fetch(`http://${API_URL}/api/users/profile/${user.id}?orgId=${user.organizationId}`);
        if (res.ok) {
          const freshData = await res.json();
          setCurrentUser(freshData);
          localStorage.setItem("koda_user", JSON.stringify(freshData));
          if (onUpdateUser) onUpdateUser(freshData);
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile details:", err);
      }
    };

    fetchFreshProfile();
  }, [user?.id]);

  // Sync form data when opening modal
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phoneNumber: currentUser.phoneNumber || '',
        siteLocation: currentUser.siteLocation || '',
        homeAddress: currentUser.homeAddress || '',
        designation: currentUser.designation || ''
      });
    }
  }, [currentUser, isEditModalOpen]);

  // Fetch organization site locations and teams on load
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.organizationId) return;
      try {
        const locRes = await fetch(`http://${API_URL}/api/locations?orgId=${currentUser.organizationId}`);
        if (locRes.ok) {
          const locData = await locRes.json();
          const locSet = new Set();
          locData.forEach(item => {
            if (item.name) locSet.add(item.name);
          });
          setLocations(Array.from(locSet).sort());
        }

        const teamRes = await fetch(`http://${API_URL}/api/teams?orgId=${currentUser.organizationId}`);
        if (teamRes.ok) {
          const allTeams = await teamRes.json();
          const filteredTeams = allTeams.filter(team =>
            team.users.some(u => u.id === currentUser.id)
          );
          setMyTeams(filteredTeams);
        }
      } catch (error) {
        console.error("Failed to load profile metadata:", error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`http://${API_URL}/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated);
        localStorage.setItem("koda_user", JSON.stringify(updated));
        if (onUpdateUser) onUpdateUser(updated);
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Server connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  const initials = `${currentUser.firstName?.charAt(0) || ''}${currentUser.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="flex-1 bg-gray-50 p-10 overflow-auto h-full font-sans relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>Workspace</span> <span className="mx-2">/</span> <span className="text-blue-600 font-bold">My Profile</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Profile</h1>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 border-0"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-xl border border-gray-200 overflow-hidden">
          <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

          <div className="px-10 pb-10 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 mb-10 gap-4">
              <div className="flex items-end gap-6">

                {/* INITIALS DISPLAY AVATAR */}
                <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-4xl font-black shrink-0">
                  {initials}
                </div>

                <div className="mb-1">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1.5">{fullName}</h2>
                  <p className="text-sm font-bold text-gray-500">{currentUser.designation || 'Team Member'}</p>
                </div>
              </div>
              <div className="mb-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${currentUser.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-200/80 space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Contact & Addresses</h3>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Mail className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Email Address</p>
                    <p className="font-bold text-sm text-gray-900">{currentUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm"><Phone className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Phone Number</p>
                    <p className={`font-bold text-sm ${currentUser.phoneNumber ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {currentUser.phoneNumber || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 shadow-sm"><Home className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Home Address</p>
                    <p className={`font-bold text-sm ${currentUser.homeAddress ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {currentUser.homeAddress || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-200/80 space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2">Work Information</h3>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm"><Building className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Organization Name</p>
                    <p className="font-bold text-sm text-gray-900">
                      {currentUser.organization?.orgName || 'Pulseworks LLC'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Briefcase className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Designation</p>
                    <p className={`font-bold text-sm ${currentUser.designation ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {currentUser.designation || 'Team Member'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 shadow-sm"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Primary Site Location</p>
                    <p className={`font-bold text-sm ${currentUser.siteLocation ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                      {currentUser.siteLocation || 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gray-50/60 p-6 rounded-2xl border border-gray-200/80">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Assigned Teams
              </h3>

              {isLoadingTeams ? (
                <p className="text-sm text-gray-500 animate-pulse py-2">Loading your teams...</p>
              ) : myTeams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeams.map(team => (
                    <div key={team.id} className="border border-gray-200 bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{team.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{team.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic py-4 text-center bg-white rounded-xl border border-gray-200">
                  You have not been assigned to any teams yet.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-colors border border-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Site Location</label>
                <select
                  value={formData.siteLocation}
                  onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
                >
                  <option value="">Select site location...</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Home Address</label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Atlanta, GA"
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Site Technician"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;