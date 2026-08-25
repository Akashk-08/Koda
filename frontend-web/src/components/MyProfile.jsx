/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Briefcase, Shield, Users, Edit3, X, Home, Camera, ChevronRight } from 'lucide-react';

const MyProfile = ({ user, onUpdateUser }) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [myTeams, setMyTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

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

  const [profilePic, setProfilePic] = useState(currentUser?.profilePicUrl || null);

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
      setProfilePic(currentUser.profilePicUrl || null);
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

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`http://${API_URL}/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, profilePicUrl: profilePic })
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

  // Helper component for clean list rows
  const InfoRow = ({ icon, label, value, isLast }) => (
    <div className={`flex items-center gap-4 py-3.5 px-4 bg-white hover:bg-gray-50/50 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold truncate mt-0.5 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] overflow-y-auto h-full font-sans relative pb-24 md:pb-8">

      <div className="max-w-md mx-auto w-full px-4 pt-6 md:pt-10 space-y-6">

        {/* CENTERED AVATAR & HERO SECTION */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Avatar with gradient ring */}
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1 shadow-lg">
              <div className="w-full h-full rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center text-3xl font-black text-blue-600">
                {profilePic || currentUser.profilePicUrl ? (
                  <img src={profilePic || currentUser.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
            {currentUser.role === 'ADMIN' && (
              <div className="absolute -bottom-2 -right-2 bg-purple-100 text-purple-700 border-2 border-white w-9 h-9 rounded-full flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{fullName}</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">{currentUser.designation || 'Team Member'}</p>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="mt-5 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-95"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>

        {/* INFO CARDS (APP-STYLE LISTS) */}
        <div className="space-y-5 pt-4">

          {/* Contact Information */}
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4 mb-2">Contact Details</h2>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <InfoRow
                icon={<Mail className="w-4 h-4 text-blue-500" />}
                label="Email Address"
                value={currentUser.email}
              />
              <InfoRow
                icon={<Phone className="w-4 h-4 text-purple-500" />}
                label="Phone Number"
                value={currentUser.phoneNumber}
              />
              <InfoRow
                icon={<Home className="w-4 h-4 text-orange-500" />}
                label="Home Address"
                value={currentUser.homeAddress}
                isLast={true}
              />
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4 mb-2">Work Information</h2>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <InfoRow
                icon={<Building className="w-4 h-4 text-indigo-500" />}
                label="Organization"
                value={currentUser.organization?.orgName || 'Pulseworks LLC'}
              />
              <InfoRow
                icon={<Briefcase className="w-4 h-4 text-blue-500" />}
                label="Designation"
                value={currentUser.designation}
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4 text-green-500" />}
                label="Primary Location"
                value={currentUser.siteLocation}
                isLast={true}
              />
            </div>
          </div>

          {/* Teams */}
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4 mb-2">Assigned Teams</h2>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-2">
              {isLoadingTeams ? (
                <div className="p-4 text-center text-sm font-medium text-gray-400">Loading teams...</div>
              ) : myTeams.length > 0 ? (
                <div className="flex flex-col">
                  {myTeams.map((team, idx) => (
                    <div key={team.id} className={`flex items-center gap-4 py-3 px-3 hover:bg-gray-50 rounded-2xl transition-colors ${idx !== myTeams.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{team.name}</h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{team.description || 'No description'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-center text-sm font-bold text-gray-400 italic">
                  Not assigned to any teams
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200">
            <div className="px-6 md:px-8 py-5 border-b border-gray-100 bg-white flex items-center justify-between sticky top-0 z-10 shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="p-5 md:p-8 space-y-6 bg-gray-50/50">

                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center justify-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center group-hover:border-blue-100 transition-colors">
                      {profilePic ? (
                        <img src={profilePic} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2.5 rounded-full text-white cursor-pointer shadow-lg transition-colors ring-2 ring-white">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase mt-4 tracking-widest">Update Photo</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
                      <input
                        required type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
                      <input
                        required type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Facilities Manager"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Site Location</label>
                    {locations.length > 0 ? (
                      <select
                        value={formData.siteLocation}
                        onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900 cursor-pointer appearance-none"
                      >
                        <option value="">Select site location...</option>
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.siteLocation}
                        onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                        placeholder="e.g. Main Office"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Home Address</label>
                    <textarea
                      rows={2}
                      value={formData.homeAddress}
                      onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                      placeholder="Enter full home address"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-gray-900 resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-5 md:px-8 py-5 bg-white border-t border-gray-100 shrink-0 pb-10 md:pb-5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0 py-3.5 text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
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