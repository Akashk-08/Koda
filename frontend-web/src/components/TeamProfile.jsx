/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Building, Briefcase, Shield, Users, ArrowLeft, Home, ChevronRight } from 'lucide-react';

const TeamProfile = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // Fetch the user's profile details
        const profileRes = await fetch(`http://${API_URL}/api/users/profile/${id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData);

          // Fetch the teams the user belongs to
          if (profileData.organizationId) {
            const teamRes = await fetch(`http://${API_URL}/api/teams?orgId=${profileData.organizationId}`);
            if (teamRes.ok) {
              const allTeams = await teamRes.json();
              const filteredTeams = allTeams.filter(team =>
                team.users.some(u => u.id === profileData.id)
              );
              setUserTeams(filteredTeams);
            }
          }
        } else {
          console.error("User not found");
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f5f7] h-full p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f4f5f7] h-full p-8">
        <h2 className="text-xl font-bold text-gray-900">User Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
  const initials = `${userProfile.firstName?.charAt(0) || ''}${userProfile.lastName?.charAt(0) || ''}`.toUpperCase();

  // Helper component for clean list rows
  const InfoRow = ({ icon, label, value, isLast }) => (
    <div className={`flex items-center gap-4 py-4 px-5 bg-white hover:bg-gray-50/50 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold truncate mt-0.5 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] overflow-y-auto h-full font-sans relative pb-24 md:pb-8">

      {/* MOBILE BACK BUTTON HEADER */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center shrink-0 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 font-bold gap-1">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 pt-6 md:pt-10">

        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 bg-gray-100 text-gray-600 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Directory</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Viewing profile details for {userProfile.firstName}.</p>
            </div>
          </div>
        </div>

        {/* RESPONSIVE GRID LAYOUT */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

          {/* LEFT COLUMN: AVATAR & HERO SECTION */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-200 flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center text-3xl md:text-5xl font-black text-blue-600">
                    {userProfile.profilePicUrl ? (
                      <img src={userProfile.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                </div>
                {userProfile.role === 'ADMIN' && (
                  <div className="absolute -bottom-2 -right-2 md:bottom-0 md:right-0 bg-purple-100 text-purple-700 border-2 border-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm" title="System Administrator">
                    <Shield className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{fullName}</h1>
              <p className="text-xs md:text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">{userProfile.designation || 'Team Member'}</p>
            </div>
          </div>

          {/* RIGHT COLUMN: INFO CARDS */}
          <div className="w-full md:w-2/3 flex flex-col gap-6">

            {/* Contact Information */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Details</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <InfoRow
                  icon={<Mail className="w-5 h-5 text-blue-500" />}
                  label="Email Address"
                  value={userProfile.email}
                />
                <InfoRow
                  icon={<Phone className="w-5 h-5 text-purple-500" />}
                  label="Phone Number"
                  value={userProfile.phoneNumber}
                  isLast={true}
                />
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Work Information</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <InfoRow
                  icon={<Building className="w-5 h-5 text-indigo-500" />}
                  label="Organization"
                  value={userProfile.organization?.orgName || 'Pulseworks LLC'}
                />
                <InfoRow
                  icon={<Briefcase className="w-5 h-5 text-blue-500" />}
                  label="Designation"
                  value={userProfile.designation}
                />
                <InfoRow
                  icon={<MapPin className="w-5 h-5 text-green-500" />}
                  label="Primary Location"
                  value={userProfile.siteLocation}
                  isLast={true}
                />
              </div>
            </div>

            {/* Teams */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned Teams</h2>
              </div>
              <div className="p-2">
                {userTeams.length > 0 ? (
                  <div className="flex flex-col">
                    {userTeams.map((team, idx) => (
                      <div key={team.id} className={`flex items-center gap-4 py-3 px-3 hover:bg-gray-50 rounded-2xl transition-colors ${idx !== userTeams.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate">{team.name}</h4>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{team.description || 'No description'}</p>
                        </div>
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
      </div>
    </div>
  );
};

export default TeamProfile;