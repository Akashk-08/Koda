import React, { useState, useEffect } from 'react';
import { Bell, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function NotificationsPage({ user }) {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
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

      // Navigate straight to the work order
      if (referenceId) {
        navigate(`/workspace/workorder/${referenceId}`);
      } else {
        // Just remove it from the list if there's no link
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto w-full pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Check className="w-12 h-12 text-green-400 mb-3" />
            <p className="text-lg font-bold text-gray-900">You're all caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No new notifications at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id, n.referenceId)}
                className="p-4 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition-colors active:scale-[0.99]"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-4">{n.message}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}