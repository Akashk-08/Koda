import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications on mount and poll every 60 seconds
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://${API_URL}/api/notifications/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id, referenceId) => {
    try {
      await fetch(`http://${API_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setIsOpen(false);

      if (referenceId) {
        navigate(`/workspace/workorder/${referenceId}`);
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleBellClick = () => {
    // If mobile screen, navigate to page. If desktop, toggle dropdown.
    if (window.innerWidth < 768) {
      navigate('/workspace/notifications');
      setIsOpen(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors relative flex items-center justify-center shadow-sm"
      >
        <Bell className="w-5 h-5 text-gray-700" />

        {/* Dynamic Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-red-600 text-white text-[10px] font-black rounded-full border-2 border-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Dropdown Menu (Hidden entirely on mobile logic) */}
      {isOpen && window.innerWidth >= 768 && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="font-extrabold text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Bell className="w-8 h-8 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No new notifications</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id, n.referenceId)}
                  className="p-4 border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors flex flex-col gap-1 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">
                      {n.title}
                    </p>
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}