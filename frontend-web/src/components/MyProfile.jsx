import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Building, Briefcase, Shield, Users } from 'lucide-react';

const MyProfile = ({ user }) => {
  const [myTeams, setMyTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  // Fetch teams and filter to only show the ones this user belongs to
  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/teams?orgId=${user.organizationId}`);
        if (response.ok) {
          const allTeams = await response.json();
          // Filter teams where the users array contains this user's ID
          const filteredTeams = allTeams.filter(team =>
            team.users.some(u => u.id === user.id)
          );
          setMyTeams(filteredTeams);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    if (user?.organizationId) {
      fetchMyTeams();
    }
  }, [user]);

  return (
    <div className="flex-1 bg-gray-50 p-8 overflow-auto h-full font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Profile</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          <div className="px-8 pb-8 relative">
            {/* Avatar Profile Overlapping Header */}
            <div className="flex justify-between items-end -mt-12 mb-8">
              <div className="flex items-end gap-5">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-blue-100 text-blue-700 flex items-center justify-center text-4xl font-black">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                  <p className="text-sm font-medium text-gray-500">{user.designation || 'Team Member'}</p>
                </div>
              </div>
              <div className="mb-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Contact Details</h3>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"><Mail className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email Address</p>
                    <p className="font-semibold text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"><Phone className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Phone Number</p>
                    <p className="font-semibold text-sm">{user.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Work Information</h3>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"><Building className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Organization ID</p>
                    <p className="font-semibold text-sm font-mono">{user.organizationId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0"><MapPin className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Primary Site Location</p>
                    <p className="font-semibold text-sm">{user.siteLocation || 'Not assigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teams Section */}
            <div className="mt-10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-4">My Teams</h3>
              {isLoadingTeams ? (
                <p className="text-sm text-gray-500 animate-pulse">Loading your teams...</p>
              ) : myTeams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTeams.map(team => (
                    <div key={team.id} className="border border-gray-100 bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{team.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1">{team.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                  You have not been assigned to any teams yet.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;