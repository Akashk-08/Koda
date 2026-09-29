/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from "react-router-dom";

// Standard Imports for Core Layout & Auth
import CreateWorkOrderModal from "./components/CreateWorkOrderModal.tsx";
import UserProfile from "./components/UserProfile.jsx";
import Footer from "./components/Footer.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Header from "./components/Header.jsx";
import Login from "./components/Login.tsx"; 
import Signup from "./components/Signup.tsx"; 
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

// Lazy-Loaded Dashboard Modules
const Project = lazy(() => import("./components/Project.jsx"));
const WorkOrders = lazy(() => import("./components/WorkOrders.jsx"));
const PreventiveMaintenance = lazy(() => import("./components/PreventiveMaintenance.tsx"));
const WorkOrderDetail = lazy(() => import("./components/WorkOrderDetail.tsx"));
const AccessRequests = lazy(() => import("./components/AccessRequests.jsx"));
const Calendar = lazy(() => import("./components/Calendar.jsx"));
const Locations = lazy(() => import("./components/Locations.jsx"));
const MyTeam = lazy(() => import("./components/MyTeam.jsx"));
const MyProfile = lazy(() => import("./components/MyProfile.jsx"));
const PartsInventory = lazy(() => import("./components/PartsInventory.tsx"));
const Assets = lazy(() => import("./components/Assets.tsx"));
const Inventory = lazy(() => import("./components/Inventory.tsx"));
const MobileMoreMenu = lazy(() => import("./components/MobileMoreMenu.jsx"));
const TeamProfile = lazy(() => import("./components/TeamProfile.jsx"));
const Analytics = lazy(() => import("./components/Analytics.tsx"));
const NotificationsPage = lazy(() => import("./components/NotificationsPage.jsx"));
const Scheduler = lazy(() => import("./components/Schedular.js"));
const RootDashboard = lazy(() => import("./components/RootDashboard.tsx"));

import {
  Box, ChevronLeft, ChevronRight, ClipboardList, Wrench, Calendar as CalendarIcon, Users, MapPin, FolderKanban, ShieldCheck, ShieldAlert, Inbox, Package, Layers, BarChart3, Home, Menu, LogOut,
} from "lucide-react";

interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  role?: string;
  approvalStatus?: string;
  siteLocation?: string;
  profilePicUrl?: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

const MobileNav = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive("/aisearch/pulseworksAI") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}>
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </Link>
      <Link to="/workspace/workorders" className={`flex flex-col items-center gap-1 ${isActive("/workspace/workorders") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}>
        <ClipboardList className="w-5 h-5" />
        <span className="text-[10px]">Work Orders</span>
      </Link>
      <Link to="/procurement/assets" className={`flex flex-col items-center gap-1 ${isActive("/procurement/assets") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}>
        <Inbox className="w-5 h-5" />
        <span className="text-[10px]">Assets</span>
      </Link>
      <Link to="/more" className={`flex flex-col items-center gap-1 ${isActive("/more") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}>
        <Menu className="w-5 h-5" />
        <span className="text-[10px]">Menu</span>
      </Link>
    </div>
  );
};

const DashboardLayout = ({ user, onSignOut, onUpdateUser, onSwitchUser }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if ((user?.role !== "ADMIN" && user?.role !== "ROOT") || !user?.organizationId) return;
    const fetchPendingRequests = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users?orgId=${user.organizationId}`);
        if (res.ok) {
          const usersData = await res.json();
          setPendingRequestsCount(usersData.filter((u: any) => u.approvalStatus === "PENDING").length);
        }
      } catch (err) {
        console.error("Failed to fetch pending requests count", err);
      }
    };
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isLinkActive = (path: string) => location.pathname.startsWith(path);

  const linkClass = (path: string) =>
    isLinkActive(path)
      ? `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 transition-colors ${isSidebarCollapsed ? "justify-center" : ""}`
      : `flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ${isSidebarCollapsed ? "justify-center" : ""}`;

  const iconClass = (path: string) =>
    isLinkActive(path)
      ? `text-blue-600 ${isSidebarCollapsed ? "" : "mr-3"} shrink-0`
      : `text-gray-400 ${isSidebarCollapsed ? "" : "mr-3"} shrink-0`;

  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();

  const rootPaths = ["/workspace/workorders", "/resources/requests", "/more", "/workspace/notifications", "/workspace/analytics", "/workspace/root-console"];
  const isRootPage = rootPaths.includes(location.pathname);

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <aside className={`hidden md:flex ${isSidebarCollapsed ? "w-20" : "w-64"} relative bg-gray-50 border-r border-gray-200 flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-30`}>
        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 shadow-md z-40 transition-transform hover:scale-110 outline-none">
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
        </button>

        <Link to="/workspace/workorders" className={`h-14 flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "px-4"} border-b border-gray-200 font-bold text-lg hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden whitespace-nowrap`}>
          <div className={`w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white shrink-0 shadow-sm ${isSidebarCollapsed ? "" : "mr-3"}`}>PW</div>
          {!isSidebarCollapsed && <span>Pulseworks CMMS</span>}
        </Link>

        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
          {user.role === "ROOT" && (
            <div className="mb-6">
              <div className={`px-3 mb-2 text-[10px] font-black text-purple-600 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}>
                {isSidebarCollapsed ? "..." : "Root Mode"}
              </div>
              <ul className="space-y-1 px-3">
                <li>
                  <Link to="/workspace/root-console" className={isLinkActive("/workspace/root-console") ? `flex items-center justify-between px-3 py-2.5 text-sm font-bold rounded-lg text-purple-700 bg-purple-50 transition-colors ${isSidebarCollapsed ? "justify-center" : ""}` : `flex items-center justify-between px-3 py-2.5 text-sm font-bold rounded-lg text-purple-600 hover:bg-purple-50/50 transition-colors ${isSidebarCollapsed ? "justify-center" : ""}`}>
                    <div className="flex items-center truncate">
                      <span className={`text-purple-600 ${isSidebarCollapsed ? "" : "mr-3"} shrink-0`}><ShieldAlert className="w-5 h-5" /></span>
                      {!isSidebarCollapsed && <span className="truncate">Root Console</span>}
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          <div className={`px-3 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}>
            {isSidebarCollapsed ? "..." : "Workspace"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/workspace/workorders" className={linkClass("/workspace/workorders")}>
                <div className="flex items-center truncate"><span className={iconClass("/workspace/workorders")}><ClipboardList className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Work Orders</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/workspace/analytics" className={linkClass("/workspace/analytics")}>
                <div className="flex items-center truncate"><span className={iconClass("/workspace/analytics")}><BarChart3 className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Analytics</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/workspace/pm" className={linkClass("/workspace/pm")}>
                <div className="flex items-center truncate"><span className={iconClass("/workspace/pm")}><Wrench className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Preventive Maintenance</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/workspace/schedular" className={linkClass("/workspace/schedular")}>
                <div className="flex items-center truncate"><span className={iconClass("/workspace/schedular")}><CalendarIcon className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Scheduler</span>}</div>
              </Link>
            </li>
          </ul>

          <div className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}>
            {isSidebarCollapsed ? "..." : "Organization"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/organization/myteam" className={linkClass("/organization/myteam")}>
                <div className="flex items-center truncate"><span className={iconClass("/organization/myteam")}><Users className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">My Team</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/organization/locations" className={linkClass("/organization/locations")}>
                <div className="flex items-center truncate"><span className={iconClass("/organization/locations")}><MapPin className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Locations</span>}</div>
              </Link>
            </li>
          </ul>

          <div className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}>
            {isSidebarCollapsed ? "..." : "Resources"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/resources/projects" className={linkClass("/resources/projects")}>
                <div className="flex items-center truncate"><span className={iconClass("/resources/projects")}><FolderKanban className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Projects</span>}</div>
              </Link>
            </li>
            {(user.role === "ADMIN" || user.role === "ROOT") && (
              <li>
                <Link to="/resources/accessrequests" className={`${linkClass("/resources/accessrequests")} relative`}>
                  <div className="flex items-center truncate"><span className={iconClass("/resources/accessrequests")}><ShieldCheck className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Access Requests</span>}</div>
                  {pendingRequestsCount > 0 && (isSidebarCollapsed ? <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-gray-50 rounded-full"></span> : <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-sm transition-all">{pendingRequestsCount}</span>)}
                </Link>
              </li>
            )}
            <li>
              <Link to="/resources/calendar" className={linkClass("/resources/calendar")}>
                <div className="flex items-center truncate"><span className={iconClass("/resources/calendar")}><CalendarIcon className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Calendar</span>}</div>
              </Link>
            </li>
          </ul>

          <div className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}>
            {isSidebarCollapsed ? "..." : "Procurement"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/procurement/assets" className={linkClass("/procurement/assets")}>
                <div className="flex items-center truncate"><span className={iconClass("/procurement/assets")}><Package className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Assets</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/procurement/partsinventory" className={linkClass("/procurement/partsinventory")}>
                <div className="flex items-center truncate"><span className={iconClass("/procurement/partsinventory")}><Box className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">Parts Inventory</span>}</div>
              </Link>
            </li>
            <li>
              <Link to="/procurement/inventory" className={linkClass("/procurement/inventory")}>
                <div className="flex items-center truncate"><span className={iconClass("/procurement/inventory")}><Layers className="w-5 h-5" /></span>{!isSidebarCollapsed && <span className="truncate">IN/OUT Inventory</span>}</div>
              </Link>
            </li>
          </ul>
        </nav>

        <Link to="/profile" className={`p-4 border-t border-gray-200 flex items-center hover:bg-gray-100 transition-colors cursor-pointer block mt-auto shrink-0 ${isSidebarCollapsed ? "justify-center px-0" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">{initials}</div>
          {!isSidebarCollapsed && (
            <div className="ml-3 flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</span>
              <span className="text-xs text-gray-500 font-medium">View Profile</span>
            </div>
          )}
        </Link>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative pb-16 md:pb-0">
        <Header user={user} onSignOut={onSignOut} onOpenWOModal={() => setIsModalOpen(true)} onSwitchUser={onSwitchUser} />
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 relative">
          {!isRootPage && (
            <div className="md:hidden w-full bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-gray-200 sticky top-0 z-40 flex items-center shrink-0">
              <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 font-extrabold text-[15px] hover:text-blue-700 transition-colors active:scale-95">
                <ChevronLeft className="w-5 h-5 mr-0.5" strokeWidth={3} /> Back
              </button>
            </div>
          )}

          <div className="flex-1">
            <Suspense fallback={
              <div className="h-full w-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-gray-500">Loading module...</p>
                </div>
              </div>
            }>
              <Routes>
                <Route path="/workspace/notifications" element={<NotificationsPage user={user} />} />
                <Route path="/workspace/analytics" element={<Analytics user={user} />} />
                <Route path="/workspace/workorder/:id" element={<WorkOrderDetail user={user} />} />
                <Route path="/workspace/workorders" element={<WorkOrders user={user} onOpenModal={() => setIsModalOpen(true)} />} />
                <Route path="/workspace/pm" element={<PreventiveMaintenance user={user} />} />
                <Route path="/workspace/schedular" element={<Scheduler user={user} />} />
                <Route path="/organization/locations" element={<Locations user={user} />} />
                <Route path="/organization/myteam" element={<MyTeam user={user} />} />
                <Route path="/resources/projects" element={<Project user={user} />} />
                <Route path="/resources/accessrequests" element={<AccessRequests user={user} />} />
                <Route path="/resources/calendar" element={<Calendar user={user} />} />
                <Route path="/workspace/root-console" element={<RootDashboard user={user} />} />
                <Route path="/procurement/partsinventory" element={<PartsInventory user={user} />} />
                <Route path="/procurement/assets" element={<Assets user={user} />} />
                <Route path="/procurement/inventory" element={<Inventory user={user} />} />
                <Route path="/workspace/my-team/:id" element={<TeamProfile currentUser={user} />} />
                <Route path="/more" element={<MobileMoreMenu user={user} />} />
                <Route path="/profile" element={<MyProfile user={user} onUpdateUser={onUpdateUser} />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </main>
        <CreateWorkOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} onCreated={() => window.location.reload()} />
        <MobileNav onOpenModal={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem("koda_user");
    return saved ? JSON.parse(saved) : null;
  });

  const INACTIVITY_LIMIT = 15 * 60 * 1000;
  const inactivityTimerRef = useRef<any>(null);

  const handleSignOut = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("koda_user");
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      handleSignOut();
      alert("You have been automatically logged out due to inactivity.");
    }, INACTIVITY_LIMIT);
  }, [user, handleSignOut]);

  useEffect(() => {
    if (!user) return;
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleUserActivity = () => resetInactivityTimer();

    events.forEach((event) => window.addEventListener(event, handleUserActivity));
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    let registrationListener: any = null;
    let foregroundListener: any = null;

    const initPushNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive !== "granted") return;

        registrationListener = await PushNotifications.addListener("registration", async (token) => {
          const currentUserStr = sessionStorage.getItem("koda_user");
          if (currentUserStr) {
            try {
              const currentUser = JSON.parse(currentUserStr);
              if (currentUser?.id) {
                await fetch(`${API_URL}/api/users/${currentUser.id}/device-token`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: token.value }),
                });
              }
            } catch (err) {
              console.error("Failed to sync push device token to backend:", err);
            }
          }
        });

        foregroundListener = await PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Foreground push notification received:", notification);
        });

        await PushNotifications.register();
      } catch (e) {
        console.warn("Push notifications initialization error:", e);
      }
    };

    initPushNotifications();

    return () => {
      if (registrationListener) registrationListener.remove();
      if (foregroundListener) foregroundListener.remove();
    };
  }, [user]);

  const handleLogin = (u: User) => {
    setUser(u);
    sessionStorage.setItem("koda_user", JSON.stringify(u));
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    sessionStorage.setItem("koda_user", JSON.stringify(u));
  };

  const handleSwitchUser = (email: string) => {
    sessionStorage.setItem("koda_kiosk_email", email);
    setUser(null);
    sessionStorage.removeItem("koda_user");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/workspace/workorders" /> : <Login onAuthSuccess={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/userprofile" /> : <Signup onAuthSuccess={handleLogin} />} />
        <Route path="/userprofile" element={user ? <UserProfile user={user} onUpdateUser={handleLogin} onSignOut={handleSignOut} /> : <Navigate to="/login" />} />
        <Route
          path="/*"
          element={
            user ? (
              user.approvalStatus === "PENDING" ? (
                <Navigate to="/userprofile" />
              ) : (
                <DashboardLayout user={user} onSignOut={handleSignOut} onSwitchUser={() => handleSwitchUser(user.email)} onUpdateUser={handleUpdateUser} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}