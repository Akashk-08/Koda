/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";

// Components
import Project from "./components/Project.jsx";
import WorkOrders from "./components/WorkOrders.jsx";
import PreventiveMaintenance from "./components/PreventiveMaintenance";
import WorkOrderDetail from "./components/WorkOrderDetail";
import CreateWorkOrderModal from "./components/CreateWorkOrderModal";
import UserProfile from "./components/UserProfile.jsx";
import AccessRequests from "./components/AccessRequests.jsx";
import Calendar from "./components/Calendar.jsx";
import Locations from "./components/Locations.jsx";
import MyTeam from "./components/MyTeam.jsx";
import Footer from "./components/Footer.jsx";
import MyProfile from "./components/MyProfile.jsx";
import LandingPage from "./components/LandingPage.jsx";
import PartsInventory from "./components/PartsInventory";
import Assets from "./components/Assets";
import Inventory from "./components/Inventory";
import MobileMoreMenu from "./components/MobileMoreMenu.jsx";
import TeamProfile from "./components/TeamProfile.jsx";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import NotificationsPage from "./components/NotificationsPage.jsx";

import {
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Wrench,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  MapPin,
  FolderKanban,
  ShieldCheck,
  Inbox,
  Package,
  Layers,
  BarChart3,
  Terminal,
  X,
  Bug,
  Home,
  Menu,
  Plus,
  LogOut,
} from "lucide-react";
import Scheduler from "./components/Schedular.js";
import Header from "./components/Header.jsx";

// INTERFACES
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

interface AuthCardProps {
  initialMode: "login" | "signup";
  onAuthSuccess: (user: User) => void;
}

const API_URL = "127.0.0.1:8080";

// AUTH COMPONENT
const AuthCard = ({ initialMode, onAuthSuccess }: AuthCardProps) => {
  const [mode, setMode] = useState<string>(initialMode);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [pin, setPin] = useState("");

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    resetCode: "",
  });

  useEffect(() => {
    const kioskEmail = localStorage.getItem("koda_kiosk_email");
    if (kioskEmail && mode === "login") {
      fetch(`${API_URL}/api/auth/get-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: kioskEmail }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.profiles && data.profiles.length > 1) {
            setFormData((prev) => ({ ...prev, email: kioskEmail }));
            setSubUsers(data.profiles);
            setMode("select_profile");
            localStorage.removeItem("koda_kiosk_email");
          }
        })
        .catch((err) => console.error("Failed to auto-load profiles", err));
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "login") {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });
        const data = await response.json();

        if (response.ok) {
          if (data.profiles && data.profiles.length > 1) {
            setSubUsers(data.profiles);
            setMode("select_profile");
          } else {
            onAuthSuccess(data.user);
            navigate("/workspace/workorders");
          }
        } else {
          setErrorMsg(data.error || "Authentication failed");
        }
      }

      if (mode === "pin_entry") {
        const response = await fetch(`${API_URL}/api/auth/verify-pin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            profileId: selectedProfile.id,
            pin: pin,
          }),
        });
        const data = await response.json();

        if (response.ok) {
          onAuthSuccess(data.user);
          navigate("/workspace/workorders");
        } else {
          setErrorMsg("Incorrect PIN. Please try again.");
          setPin("");
        }
      }

      if (mode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          return setErrorMsg("Passwords do not match!");
        }
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData }),
        });
        const data = await response.json();
        if (response.ok) {
          onAuthSuccess(data.user || data);
          navigate("/workspace/workorders");
        } else {
          setErrorMsg(data.error || "Authentication failed");
        }
      }

      if (mode === "forgot_email") {
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        if (response.ok) {
          setSuccessMsg("If your email is registered, a code has been sent.");
          setMode("forgot_code");
        } else {
          setErrorMsg("Failed to request password reset.");
        }
      }

      if (mode === "forgot_code") {
        const response = await fetch(`${API_URL}/api/auth/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.resetCode,
          }),
        });
        const data = await response.json();
        if (response.ok) {
          setSuccessMsg("Code verified! You may now reset your password.");
          setMode("forgot_reset");
        } else {
          setErrorMsg(data.error || "Invalid code.");
        }
      }

      if (mode === "forgot_reset") {
        if (formData.password !== formData.confirmPassword) {
          return setErrorMsg("Passwords do not match!");
        }
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.resetCode,
            newPassword: formData.password,
          }),
        });
        if (response.ok) {
          alert("Password successfully reset! You can now log in.");
          setMode("login");
          setFormData({
            ...formData,
            password: "",
            confirmPassword: "",
            resetCode: "",
          });
        } else {
          setErrorMsg("Failed to reset password.");
        }
      }
    } catch (err) {
      setErrorMsg("Failed to connect to the server.");
    }
  };

  const handleProfileSelect = (profile: any) => {
    setSelectedProfile(profile);
    setMode("pin_entry");
  };

  const inputClasses =
    "w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <div className="flex-1 flex font-sans bg-white">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-10 shadow-xl">
              PW
            </div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Streamline your
              <br />
              maintenance operations.
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              Pulseworks CMMS helps your team track assets, manage preventive maintenance, and
              resolve work orders faster than ever.
            </p>
          </div>
          <div className="absolute -bottom-32 -left-40 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
        </div>

        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative overflow-y-auto">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-left mb-10">
              <div className="lg:hidden w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-6 shadow-lg">
                PW
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {mode === "login" && "Welcome back"}
                {mode === "signup" && "Get started with Pulseworks CMMS"}
                {mode === "forgot_email" && "Reset Password"}
                {mode === "forgot_code" && "Verify Code"}
                {mode === "forgot_reset" && "Create New Password"}
                {mode === "select_profile" && "Who is using the device?"}
                {mode === "pin_entry" && `Welcome, ${selectedProfile?.firstName}`}
              </h2>
              <p className="text-gray-500 text-sm">
                {mode === "login" && "Please enter your details to sign in to your workspace."}
                {mode === "signup" && "Create a new organization workspace for your team."}
                {mode === "forgot_email" &&
                  "Enter your email address and we'll send you a 4-digit code."}
                {mode === "forgot_code" && `Enter the 4-digit code sent to ${formData.email}`}
                {mode === "forgot_reset" && "Please enter a strong new password."}
                {mode === "select_profile" && "Select your profile to continue to the workspace."}
                {mode === "pin_entry" && "Please enter your 4-digit security PIN."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50/80 border-l-4 border-green-500 text-green-700 text-sm font-medium rounded-r-lg">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "select_profile" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {subUsers.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleProfileSelect(profile)}
                        className="p-6 border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center gap-3 bg-gray-50 hover:bg-white"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                          {profile.firstName.charAt(0)}
                          {profile.lastName.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{profile.firstName}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sign Out / Reset Kiosk Button */}
                  <div className="pt-4 border-t border-gray-100 flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("koda_kiosk_email");
                        setSubUsers([]);
                        setMode("login");
                        setFormData((prev) => ({ ...prev, email: "", password: "" }));
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out of Device
                    </button>
                  </div>
                </div>
              )}

              {mode === "pin_entry" && (
                <div className="space-y-6">
                  <div>
                    <input
                      required
                      autoFocus
                      className={`${inputClasses} text-center tracking-[1em] text-3xl font-black`}
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("select_profile");
                        setPin("");
                      }}
                      className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3.5 rounded-xl font-bold transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                    >
                      Login
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <>
                  <div>
                    <input
                      required
                      className={inputClasses}
                      type="text"
                      placeholder="Organization Name"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-4">
                    <input
                      required
                      className={inputClasses}
                      type="text"
                      placeholder="First Name"
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                    <input
                      required
                      className={inputClasses}
                      type="text"
                      placeholder="Last Name"
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </>
              )}

              {(mode === "login" || mode === "signup" || mode === "forgot_email") && (
                <div>
                  <input
                    required
                    className={inputClasses}
                    type="email"
                    placeholder="Work Email for eg.(xyz@companyName.com)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              )}

              {(mode === "login" || mode === "signup" || mode === "forgot_reset") && (
                <div>
                  <input
                    required
                    className={inputClasses}
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              {(mode === "signup" || mode === "forgot_reset") && (
                <div>
                  <input
                    required
                    className={inputClasses}
                    type="password"
                    placeholder="Confirm Password"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {mode === "forgot_code" && (
                <div>
                  <input
                    required
                    className={`${inputClasses} text-center tracking-[1em] text-2xl font-black`}
                    type="text"
                    maxLength={4}
                    placeholder="0000"
                    onChange={(e) => setFormData({ ...formData, resetCode: e.target.value })}
                  />
                </div>
              )}

              {mode === "login" && (
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot_email");
                      setErrorMsg("");
                    }}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {mode !== "select_profile" && mode !== "pin_entry" && (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-6 border-0"
                >
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Workspace"}
                  {mode === "forgot_email" && "Send Code"}
                  {mode === "forgot_code" && "Verify Code"}
                  {mode === "forgot_reset" && "Update Password"}
                </button>
              )}
            </form>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center lg:text-left text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between">
              {mode === "login" && (
                <>
                  <span className="font-medium">Don't have an account?</span>
                  <button
                    onClick={() => setMode("signup")}
                    className="mt-3 sm:mt-0 font-bold text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 hover:bg-blue-50 rounded-lg"
                  >
                    Create an account
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  <span className="font-medium">Already have an account?</span>
                  <button
                    onClick={() => setMode("login")}
                    className="mt-3 sm:mt-0 font-bold text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 hover:bg-blue-50 rounded-lg"
                  >
                    Sign in to existing workspace
                  </button>
                </>
              )}
              {mode.startsWith("forgot") && (
                <button
                  onClick={() => setMode("login")}
                  className="mx-auto font-bold text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 hover:bg-blue-50 rounded-lg"
                >
                  Return to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// MOBILE BOTTOM NAVIGATION & FAB COMPONENT
const MobileNav = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-2 flex justify-between items-center z-40 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${isActive("/aisearch/pulseworksAI") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          to="/workspace/workorders"
          className={`flex flex-col items-center gap-1 ${isActive("/workspace/workorders") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px]">Work Orders</span>
        </Link>

        <Link
          to="/procurement/assets"
          className={`flex flex-col items-center gap-1 ${isActive("/procurement/assets") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}
        >
          <Inbox className="w-5 h-5" />
          <span className="text-[10px]">Assets</span>
        </Link>

        <Link
          to="/more"
          className={`flex flex-col items-center gap-1 ${isActive("/more") ? "text-blue-600 font-bold" : "text-gray-400 font-medium"}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Menu</span>
        </Link>
      </div>
    </>
  );
};

// DASHBOARD / LAYOUT COMPONENT
const DashboardLayout = ({
  user,
  onSignOut,
  onUpdateUser,
  onSwitchUser,
}: {
  user: User;
  onSignOut: () => void;
  onUpdateUser: (u: User) => void;
  onSwitchUser: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Polling for pending access requests if user is Admin
  useEffect(() => {
    if (user?.role !== "ADMIN" || !user?.organizationId) return;

    const fetchPendingRequests = async () => {
      // 1. THIS WILL PROVE IF YOUR .ENV IS WORKING
      console.log("Currently trying to fetch from API_URL:", API_URL);

      try {
        // 2. UPDATED TO USE YOUR NEW BULLETPROOF BACKEND ROUTE
        const res = await fetch(`${API_URL}/api/users?orgId=${user.organizationId}`);

        if (res.ok) {
          const usersData = await res.json();
          const count = usersData.filter((u: any) => u.approvalStatus === "PENDING").length;
          setPendingRequestsCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch pending requests count", err);
      }
    };

    fetchPendingRequests();
    // Poll every 30 seconds
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

  const initials =
    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();

  // Root paths where the back button should NOT be shown
  const rootPaths = [
    "/workspace/workorders",
    "/resources/requests",
    "/more",
    "/workspace/notifications",
  ];
  const isRootPage = rootPaths.includes(location.pathname);

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans relative pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* SIDEBAR (Hidden on mobile via hidden md:flex) */}
      <aside
        className={`hidden md:flex ${isSidebarCollapsed ? "w-20" : "w-64"} relative bg-gray-50 border-r border-gray-200 flex-col h-full shrink-0 transition-all duration-300 ease-in-out z-30`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 shadow-md z-40 transition-transform hover:scale-110 outline-none"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 ml-0.5" />
          ) : (
            <ChevronLeft className="w-4 h-4 mr-0.5" />
          )}
        </button>

        <Link
          to="/workspace/workorders"
          className={`h-14 flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "px-4"} border-b border-gray-200 font-bold text-lg hover:bg-gray-100 transition-colors cursor-pointer overflow-hidden whitespace-nowrap`}
          title={isSidebarCollapsed ? "Pulseworks CMMS" : ""}
        >
          <div
            className={`w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white shrink-0 shadow-sm ${isSidebarCollapsed ? "" : "mr-3"}`}
          >
            PW
          </div>
          {!isSidebarCollapsed && <span>Pulseworks CMMS</span>}
        </Link>

        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden custom-scrollbar">
          <div
            className={`px-3 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}
          >
            {isSidebarCollapsed ? "..." : "Workspace"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link
                to="/workspace/workorders"
                className={linkClass("/workspace/workorders")}
                title={isSidebarCollapsed ? "Work Orders" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/workspace/workorders")}>
                    <ClipboardList className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Work Orders</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/workspace/pm"
                className={linkClass("/workspace/pm")}
                title={isSidebarCollapsed ? "Preventive Maintenance" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/workspace/pm")}>
                    <Wrench className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Preventive Maintenance</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/workspace/schedular"
                className={linkClass("/workspace/schedular")}
                title={isSidebarCollapsed ? "Scheduler" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/workspace/schedular")}>
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Scheduler</span>}
                </div>
              </Link>
            </li>
          </ul>

          <div
            className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}
          >
            {isSidebarCollapsed ? "..." : "AI Search"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link
                to="/aisearch/pulseworksAI"
                className={linkClass("/aisearch/pulseworksAI")}
                title={isSidebarCollapsed ? "Pulseworks AI" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/aisearch/pulseworksAI")}>
                    <Sparkles className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Pulseworks AI</span>}
                </div>
              </Link>
            </li>
          </ul>

          <div
            className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}
          >
            {isSidebarCollapsed ? "..." : "Organization"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link
                to="/organization/myteam"
                className={linkClass("/organization/myteam")}
                title={isSidebarCollapsed ? "My Team" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/organization/myteam")}>
                    <Users className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">My Team</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/organization/locations"
                className={linkClass("/organization/locations")}
                title={isSidebarCollapsed ? "Locations" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/organization/locations")}>
                    <MapPin className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Locations</span>}
                </div>
              </Link>
            </li>
          </ul>

          <div
            className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}
          >
            {isSidebarCollapsed ? "..." : "Resources"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link
                to="/resources/projects"
                className={linkClass("/resources/projects")}
                title={isSidebarCollapsed ? "Projects" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/resources/projects")}>
                    <FolderKanban className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Projects</span>}
                </div>
              </Link>
            </li>
            {user.role === "ADMIN" && (
              <li>
                <Link
                  to="/resources/accessrequests"
                  className={`${linkClass("/resources/accessrequests")} relative`}
                  title={isSidebarCollapsed ? "Access Requests" : ""}
                >
                  <div className="flex items-center truncate">
                    <span className={iconClass("/resources/accessrequests")}>
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    {!isSidebarCollapsed && <span className="truncate">Access Requests</span>}
                  </div>

                  {/* DYNAMIC PENDING REQUEST BADGE */}
                  {pendingRequestsCount > 0 &&
                    (isSidebarCollapsed ? (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-gray-50 rounded-full"></span>
                    ) : (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-sm transition-all animate-in zoom-in">
                        {pendingRequestsCount}
                      </span>
                    ))}
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/resources/calendar"
                className={linkClass("/resources/calendar")}
                title={isSidebarCollapsed ? "Calendar" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/resources/calendar")}>
                    <CalendarIcon className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Calendar</span>}
                </div>
              </Link>
            </li>
          </ul>

          <div
            className={`px-3 mt-8 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "text-center" : ""}`}
          >
            {isSidebarCollapsed ? "..." : "Procurement"}
          </div>
          <ul className="space-y-1 px-3">
            <li>
              <Link
                to="/procurement/assets"
                className={linkClass("/procurement/assets")}
                title={isSidebarCollapsed ? "Assets" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/procurement/assets")}>
                    <Package className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Assets</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/procurement/partsinventory"
                className={linkClass("/procurement/partsinventory")}
                title={isSidebarCollapsed ? "Parts Inventory" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/procurement/partsinventory")}>
                    <Box className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">Parts Inventory</span>}
                </div>
              </Link>
            </li>
            <li>
              <Link
                to="/procurement/inventory"
                className={linkClass("/procurement/inventory")}
                title={isSidebarCollapsed ? "IN/OUT Inventory" : ""}
              >
                <div className="flex items-center truncate">
                  <span className={iconClass("/procurement/inventory")}>
                    <Layers className="w-5 h-5" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">IN/OUT Inventory</span>}
                </div>
              </Link>
            </li>
          </ul>
        </nav>

        <Link
          to="/profile"
          className={`p-4 border-t border-gray-200 flex items-center hover:bg-gray-100 transition-colors cursor-pointer block mt-auto shrink-0 ${isSidebarCollapsed ? "justify-center px-0" : ""}`}
          title={isSidebarCollapsed ? "View Profile" : ""}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
            {initials}
          </div>
          {!isSidebarCollapsed && (
            <div className="ml-3 flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-gray-500 font-medium">View Profile</span>
            </div>
          )}
        </Link>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative pb-16 md:pb-0">
        <Header
          user={user}
          onSignOut={onSignOut}
          onOpenWOModal={() => setIsModalOpen(true)}
          onSwitchUser={onSwitchUser}
        />

        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50 relative">
          {/* MOBILE GLOBAL BACK NAVIGATION */}
          {!isRootPage && (
            <div className="md:hidden w-full bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-gray-200 sticky top-0 z-40 flex items-center shrink-0">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-blue-600 font-extrabold text-[15px] hover:text-blue-700 transition-colors active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 mr-0.5" strokeWidth={3} />
                Back
              </button>
            </div>
          )}

          <div className="flex-1">
            <Routes>
              {/* Added NotificationsPage inside DashboardLayout so header/footer remain visible */}
              <Route path="/workspace/notifications" element={<NotificationsPage user={user} />} />

              <Route path="/workspace/workorder/:id" element={<WorkOrderDetail user={user} />} />
              <Route
                path="/workspace/workorders"
                element={<WorkOrders user={user} onOpenModal={() => setIsModalOpen(true)} />}
              />
              <Route path="/workspace/pm" element={<PreventiveMaintenance user={user} />} />
              <Route path="/workspace/schedular" element={<Scheduler user={user} />} />

              <Route path="/aisearch/pulseworksAI" />

              <Route path="/organization/locations" element={<Locations />} />
              <Route path="/organization/myteam" element={<MyTeam user={user} />} />

              <Route path="/resources/projects" element={<Project user={user} />} />
              <Route path="/resources/accessrequests" element={<AccessRequests user={user} />} />
              <Route path="/resources/calendar" element={<Calendar user={user} />} />

              <Route path="/procurement/partsinventory" element={<PartsInventory user={user} />} />
              <Route path="/procurement/assets" element={<Assets user={user} />} />
              <Route path="/procurement/inventory" element={<Inventory user={user} />} />
              <Route path="/workspace/my-team/:id" element={<TeamProfile currentUser={user} />} />
              <Route path="/more" element={<MobileMoreMenu user={user} />} />
              <Route
                path="/profile"
                element={<MyProfile user={user} onUpdateUser={onUpdateUser} />}
              />

              {/* <Route path="/analytics/metrics" /> */}

              <Route
                path="/profile"
                element={<MyProfile user={user} onUpdateUser={onUpdateUser} />}
              />
            </Routes>
          </div>
          <Footer />
        </main>

        <CreateWorkOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user}
          onCreated={() => window.location.reload()}
        />

        {/* MOBILE NAVIGATION BAR & FAB */}
        <MobileNav onOpenModal={() => setIsModalOpen(true)} />
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("koda_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Request Push Notifications permissions and register token on app startup for native devices
  useEffect(() => {
    let registrationListener: any = null;
    let foregroundListener: any = null;

    const initPushNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== "granted") return;

        // Listen for token generation and sync with backend
        registrationListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            const currentUserStr = localStorage.getItem("koda_user");
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
          },
        );

        // Listen for notifications received while app is open in foreground
        foregroundListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Foreground push notification received:", notification);
          },
        );

        await PushNotifications.register();
      } catch (e) {
        console.warn("Push notifications initialization error:", e);
      }
    };

    initPushNotifications();

    return () => {
      if (registrationListener) {
        registrationListener.remove();
      }
      if (foregroundListener) {
        foregroundListener.remove();
      }
    };
  }, [user]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("koda_user", JSON.stringify(u));
  };

  const handleUpdateUser = (u: User) => {
    setUser(u);
    localStorage.setItem("koda_user", JSON.stringify(u));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("koda_user");
  };

  const handleSwitchUser = (email: string) => {
    localStorage.setItem("koda_kiosk_email", email);
    setUser(null);
    localStorage.removeItem("koda_user");
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/workspace/workorders" />
            ) : (
              <AuthCard initialMode="login" onAuthSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/userprofile" />
            ) : (
              <AuthCard initialMode="signup" onAuthSuccess={handleLogin} />
            )
          }
        />
        <Route
          path="/userprofile"
          element={
            user ? (
              <UserProfile user={user} onUpdateUser={handleLogin} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/*"
          element={
            user ? (
              user.approvalStatus === "PENDING" ? (
                <Navigate to="/userprofile" />
              ) : (
                <DashboardLayout
                  user={user}
                  onSignOut={handleSignOut}
                  onSwitchUser={() => handleSwitchUser(user.email)}
                  onUpdateUser={handleUpdateUser}
                />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}
