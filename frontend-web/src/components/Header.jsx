import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Wrench, ShieldCheck, MessageSquare, Key, Box, User as UserIcon } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Use the dynamic environment variable instead of a hardcoded IP
const API_URL = import.meta.env.VITE_API_URL;

const Header = ({ user, onSignOut, onOpenWOModal, onSwitchUser }) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasMultipleProfiles, setHasMultipleProfiles] = useState(false);

  const createDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns if the user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if this email has multiple profiles when the header loads
  useEffect(() => {
    if (user?.email) {
      fetch(`http://${API_URL}/api/auth/get-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.profiles && data.profiles.length > 1) {
            setHasMultipleProfiles(true);
          } else {
            setHasMultipleProfiles(false);
          }
        })
        .catch(err => console.error("Failed to fetch profile count", err));
    }
  }, [user?.email]);

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20 bg-white">
      {/* GLOBAL SEARCH BAR */}
      <div className="relative hidden md:block">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 w-64 shadow-sm"
        />
      </div>

      <div className="flex items-center space-x-3 ml-auto">

        {/* NOTIFICATION BELL COMPONENT */}
        <NotificationBell user={user} />

        {/* + CREATE DROPDOWN COMPONENT (Visible on all screens) */}
        <div className="relative" ref={createDropdownRef}>
          <button
            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-3 md:px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 md:gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create
          </button>

          {isCreateMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-150">

              <button
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  navigate('/workspace/workorders');
                  onOpenWOModal();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-bold flex items-center gap-3 transition-colors"
              >
                <Wrench className="w-4 h-4" /> Work Order
              </button>

              <button
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  navigate('/workspace/pm');
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 font-bold flex items-center gap-3 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Preventive Maintenance
              </button>

              {user?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    navigate('/resources/accessrequests');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 font-bold flex items-center gap-3 transition-colors"
                >
                  <Key className="w-4 h-4" /> Access Request
                </button>
              )}

            </div>
          )}
        </div>

        {/* USER PROFILE & SIGN OUT DROPDOWN (Properly aligned) */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-md text-sm font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4 text-blue-600" />
            {user?.firstName || "Profile"}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in duration-150">

              <button
                onClick={() => {
                  if (hasMultipleProfiles) {
                    setIsUserMenuOpen(false);
                    onSwitchUser();
                  }
                }}
                disabled={!hasMultipleProfiles}
                title={hasMultipleProfiles ? "Switch to another profile" : "No other profiles associated with this email"}
                className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${hasMultipleProfiles
                    ? "text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                    : "text-gray-400 opacity-60 cursor-not-allowed"
                  }`}
              >
                Switch Profile
              </button>

              <div className="h-px bg-gray-100 my-1 mx-2"></div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onSignOut();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out of Device
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;