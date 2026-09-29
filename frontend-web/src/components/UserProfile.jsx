/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Building2, MapPin, Briefcase, Phone } from 'lucide-react';
import Footer from './Footer.jsx';

const DEFAULT_SITE_LOCATIONS = [
  "Pulseworks Shop",
  "LSC-Liberty Science Center",
  "Museum of Flight",
  "USS Midway",
  "USS Lexington",
  "Patriots Point",
  "Intrepid Sea, Air & Space Museum",
  "GAAQ",
  "Smithsonian National Air and Space Museum",
  "St Louis Science Center",
  "USAFM Dayton, OH"
];

const UserProfile = ({ user, onUpdateUser, onSignOut }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [profilePic, setProfilePic] = useState(user?.profilePicUrl || null);
  const [orgName, setOrgName] = useState("Loading...");

  const [isCustomLocation, setIsCustomLocation] = useState(false);

  const isPulseworks =
    user?.email?.toLowerCase().endsWith('@pulseworks.com') ||
    user?.organization?.orgName?.toLowerCase().includes('pulseworks') ||
    user?.email?.toLowerCase().endsWith('@pulseworksops.com');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    siteLocation: user?.siteLocation || '',
    designation: user?.designation || ''
  });
  
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user?.id) return;
        const orgId = user?.organizationId;
        
        const profileRes = await fetch(`${API_URL}/api/users/profile/${user.id}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setOrgName(profileData.organization?.orgName || "Pulseworks LLC");
        }

        const url = orgId ? `${API_URL}/api/locations?orgId=${orgId}` : `${API_URL}/api/assets`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const locationSet = new Set(isPulseworks ? DEFAULT_SITE_LOCATIONS : []);
          data.forEach((item) => {
            if (item.name) locationSet.add(item.name);
            if (item.locationName) locationSet.add(item.locationName);
          });
          setLocations(Array.from(locationSet).sort());
        }
      } catch (err) {
        console.error("Failed to fetch user metadata:", err);
      }
    };

    fetchUserData();
  }, [user?.id, user?.organizationId, isPulseworks]);

  useEffect(() => {
    if (!isPulseworks && locations.length === 0) {
      setIsCustomLocation(true);
    }
  }, [isPulseworks, locations]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, profilePicUrl: profilePic })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        if (updatedUser.approvalStatus === 'PENDING') {
          alert("Profile submitted! Please wait for admin approval to access the workspace.");
          onSignOut();
          navigate('/login');
        } else {
          onUpdateUser(updatedUser);
          navigate('/');
        }
      } else {
        alert("Failed to submit profile updates.");
      }
    } catch (err) {
      alert("Failed to connect to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold mb-2">Complete Your Profile</h2>
              <p className="text-blue-100 text-sm">Please provide your details to request workspace access.</p>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white cursor-pointer shadow-md transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-medium">Upload profile picture</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Building2 className="w-3 h-3" /> Organization</label>
                <input
                  type="text"
                  value={orgName}
                  disabled
                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">Work Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-medium text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">First Name</label>
                <input required type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> Site Location</label>
                {!isCustomLocation && locations.length > 0 ? (
                  <select
                    required
                    value={formData.siteLocation}
                    onChange={(e) => {
                      if (e.target.value === 'OTHER') {
                        setIsCustomLocation(true);
                        setFormData({ ...formData, siteLocation: '' });
                      } else {
                        setFormData({ ...formData, siteLocation: e.target.value });
                      }
                    }}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">Select a site...</option>
                    {locations.map(locName => (
                      <option key={locName} value={locName}>{locName}</option>
                    ))}
                    <option value="OTHER">Other (Type manually)</option>
                  </select>
                ) : (
                  <input
                    required
                    type="text"
                    placeholder="e.g. New York Office"
                    value={formData.siteLocation}
                    onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Designation</label>
                <input
                  required
                  list="designation-options"
                  type="text"
                  placeholder="Select or type designation..."
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800"
                />
                <datalist id="designation-options">
                  <option value="Site Technician" />
                  <option value="Site Manager" />
                  <option value="Site Assistant Manager" />
                  <option value="Site Operator" />
                  <option value="Facilities Manager" />
                  <option value="Maintenance Engineer" />
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone Number</label>
              <input required type="tel" value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="(555) 123-4567" className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800" />
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
              <button type="button" onClick={() => { onSignOut(); navigate('/login'); }} className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;