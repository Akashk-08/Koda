import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wrench, ShieldCheck, Key, User as UserIcon, Download, FileSpreadsheet, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

// Use the dynamic environment variable instead of a hardcoded IP
const API_URL = import.meta.env.VITE_API_URL;

// Admin CSV Export Dropdown Component
const ExportDataButton = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  // Only render for administrators
  if (user?.role !== "ADMIN") return null;

  const handleDownload = async (entityType) => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      const response = await fetch(
        `${API_URL}/api/export/csv?orgId=${user.organizationId}&type=${entityType}`
      );
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${entityType}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition-all"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 text-xs">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100">
            Select Dataset
          </div>
          <button
            onClick={() => handleDownload("workorders")}
            className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-center justify-between font-medium text-gray-700"
          >
            <span>Work Orders</span>
            <Download className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => handleDownload("assets")}
            className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-center justify-between font-medium text-gray-700"
          >
            <span>Assets</span>
            <Download className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => handleDownload("inventory")}
            className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 flex items-center justify-between font-medium text-gray-700"
          >
            <span>Parts Inventory</span>
            <Download className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

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
      fetch(`${API_URL}/api/auth/get-profiles`, {
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
      {/* CSV Export Button placed in the previously empty left space */}
      <div className="flex items-center">
        <ExportDataButton user={user} />
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

        {/* USER PROFILE & SIGN OUT DROPDOWN */}
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