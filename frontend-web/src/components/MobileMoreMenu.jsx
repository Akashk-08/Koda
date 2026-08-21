import React from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  MapPin,
  FolderKanban,
  ShieldCheck,
  Package,
  Box,
  Layers,
  BarChart3,
  ChevronRight
} from "lucide-react";

const MobileMoreMenu = ({ user }) => {
  const initials = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase();

  // Grouped exactly like your desktop sidebar
  const menuSections = [
    {
      title: "AI Search",
      items: [
        { label: "Pulseworks AI", icon: Sparkles, to: "/aisearch/pulseworksAI", color: "text-purple-600", bg: "bg-purple-100" }
      ]
    },
    {
      title: "Organization",
      items: [
        { label: "My Team", icon: Users, to: "/organization/myteam", color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Locations", icon: MapPin, to: "/organization/locations", color: "text-rose-600", bg: "bg-rose-100" }
      ]
    },
    {
      title: "Resources",
      items: [
        { label: "Projects", icon: FolderKanban, to: "/resources/projects", color: "text-amber-600", bg: "bg-amber-100" },
        // Only show Access Requests if user is an ADMIN
        ...(user?.role === "ADMIN" ? [{ label: "Access Requests", icon: ShieldCheck, to: "/resources/accessrequests", color: "text-emerald-600", bg: "bg-emerald-100" }] : []),
        { label: "Calendar", icon: CalendarIcon, to: "/resources/calendar", color: "text-indigo-600", bg: "bg-indigo-100" }
      ]
    },
    {
      title: "Procurement",
      items: [
        { label: "Assets", icon: Package, to: "/procurement/assets", color: "text-cyan-600", bg: "bg-cyan-100" },
        { label: "Parts Inventory", icon: Box, to: "/procurement/partsinventory", color: "text-teal-600", bg: "bg-teal-100" },
        { label: "IN/OUT Inventory", icon: Layers, to: "/procurement/inventory", color: "text-sky-600", bg: "bg-sky-100" }
      ]
    },
    {
      title: "Analytics",
      items: [
        { label: "Metrics", icon: BarChart3, to: "/analytics/metrics", color: "text-pink-600", bg: "bg-pink-100" }
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-y-auto font-sans pb-28">

      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Menu</h1>
      </div>

      <div className="px-4 mt-6 space-y-6">

        {/* Menu Sections (Native iOS Style Cards) */}
        {menuSections.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-4 mb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={itemIdx}
                    to={item.to}
                    className={`flex items-center p-4 active:bg-gray-50 transition-colors ${itemIdx !== section.items.length - 1 ? "border-b border-gray-100" : ""
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="ml-4 font-bold text-sm text-gray-800 flex-1">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Prominent Profile Button at the Bottom */}
        <div className="pt-4 pb-8">
          <Link
            to="/profile"
            className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-gray-200 active:scale-[0.98] transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {initials}
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-xs text-blue-600 font-bold mt-0.5">
                View & Edit Profile
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default MobileMoreMenu;