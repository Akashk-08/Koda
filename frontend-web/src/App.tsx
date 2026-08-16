/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import {
  BrowserRouter,
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
import PreventiveMaintenance from "./components/PreventiveMaintenance.jsx";
import WorkOrderDetail from "./components/WorkOrderDetail";
import CreateWorkOrderModal from "./components/CreateWorkOrderModal";
import UserProfile from "./components/UserProfile.jsx";
import Requests from "./components/AccessRequests.jsx";
import Locations from "./components/Locations.jsx";
import MyTeam from "./components/MyTeam.jsx";
import Footer from "./components/Footer.jsx";
import MyProfile from "./components/MyProfile.jsx";
import LandingPage from "./components/LandingPage.jsx";
import PartsInventory from "./components/PartsInventory";
import Assets from "./components/Assets";
import Inventory from "./components/Inventory";
import { Box } from "lucide-react";

// INTERFACES
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  role?: string;
  approvalStatus?: string;
  siteLocation?: string; // Added to support location-based access control
}

interface AuthCardProps {
  initialMode: "login" | "signup";
  onAuthSuccess: (user: User) => void;
}

// ICONS
const IconList = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
const IconBox = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);
const IconUsers = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// AUTH COMPONENT WITH OTP PASSWORD RECOVERY
const AuthCard = ({ initialMode, onAuthSuccess }: AuthCardProps) => {
  const [mode, setMode] = useState<string>(initialMode);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    resetCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "login" || mode === "signup") {
        if (
          mode === "signup" &&
          formData.password !== formData.confirmPassword
        ) {
          return setErrorMsg("Passwords do not match!");
        }
        const endpoint =
          mode === "login" ? "/api/auth/login" : "/api/auth/signup";
        const response = await fetch(`http://localhost:8080${endpoint}`, {
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
        const response = await fetch(
          `http://localhost:8080/api/auth/forgot-password`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          },
        );
        if (response.ok) {
          setSuccessMsg("If your email is registered, a code has been sent.");
          setMode("forgot_code");
        } else {
          setErrorMsg("Failed to request password reset.");
        }
      }

      if (mode === "forgot_code") {
        const response = await fetch(
          `http://localhost:8080/api/auth/verify-code`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              code: formData.resetCode,
            }),
          },
        );
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
        const response = await fetch(
          `http://localhost:8080/api/auth/reset-password`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              code: formData.resetCode,
              newPassword: formData.password,
            }),
          },
        );
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
              Pulseworks CMMS helps your team track assets, manage preventive
              maintenance, and resolve work orders faster than ever.
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
              </h2>
              <p className="text-gray-500 text-sm">
                {mode === "login" &&
                  "Please enter your details to sign in to your workspace."}
                {mode === "signup" &&
                  "Create a new organization workspace for your team."}
                {mode === "forgot_email" &&
                  "Enter your email address and we'll send you a 4-digit code."}
                {mode === "forgot_code" &&
                  `Enter the 4-digit code sent to ${formData.email}`}
                {mode === "forgot_reset" &&
                  "Please enter a strong new password."}
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
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                    <input
                      required
                      className={inputClasses}
                      type="text"
                      placeholder="Last Name"
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {(mode === "login" ||
                mode === "signup" ||
                mode === "forgot_email") && (
                <div>
                  <input
                    required
                    className={inputClasses}
                    type="email"
                    placeholder="Work Email for eg.(xyz@companyName.com)"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              )}

              {(mode === "login" ||
                mode === "signup" ||
                mode === "forgot_reset") && (
                <div>
                  <input
                    required
                    className={inputClasses}
                    type="password"
                    placeholder="Password"
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, resetCode: e.target.value })
                    }
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

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-6"
              >
                {mode === "login" && "Sign In"}
                {mode === "signup" && "Create Workspace"}
                {mode === "forgot_email" && "Send Code"}
                {mode === "forgot_code" && "Verify Code"}
                {mode === "forgot_reset" && "Update Password"}
              </button>
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

// DASHBOARD / LAYOUT COMPONENT
const DashboardLayout = ({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const location = useLocation();

  const isLinkActive = (path: string) => location.pathname.startsWith(path);

  const linkClass = (path: string) =>
    isLinkActive(path)
      ? "flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50"
      : "flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition-colors";

  const iconClass = (path: string) =>
    isLinkActive(path) ? "mr-3 text-blue-600" : "mr-3 text-gray-400";

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 font-bold text-lg">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white mr-3">
            PW
          </div>{" "}
          Pulseworks CMMS
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/workspace/workorders"
                className={linkClass("/workspace/workorders")}
              >
                <span className={iconClass("/workspace/workorders")}>
                  <IconList />
                </span>
                Work Orders
              </Link>
            </li>
            <li>
              <Link to="/workspace/pm" className={linkClass("/workspace/pm")}>
                <span className={iconClass("/workspace/pm")}>
                  <IconBox />
                </span>
                Preventive Maintenance
              </Link>
            </li>
            <li>
              <Link
                to="/workspace/schedular"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Schedular
              </Link>
            </li>
          </ul>
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            AI search
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/aisearch/pulseworksAI"
                className={linkClass("/aisearch/pulseworksAI")}
              >
                <span className={iconClass("/aisearch/pulseworksAI")}>
                  <IconUsers />
                </span>
                Pulseworks AI
              </Link>
            </li>
          </ul>
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Organization
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/organization/myteam"
                className={linkClass("/organization/myteam")}
              >
                <span className={iconClass("/organization/myteam")}>
                  <IconUsers />
                </span>
                My Team
              </Link>
            </li>
            <li>
              <Link
                to="/organization/locations"
                className={linkClass("/organization/locations")}
              >
                <span className={iconClass("/organization/locations")}>
                  <IconUsers />
                </span>
                Locations
              </Link>
            </li>
          </ul>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Resources
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/resources/projects"
                className={linkClass("/resources/projects")}
              >
                <span className={iconClass("/resources/projects")}>
                  <IconList />
                </span>
                Projects
              </Link>
            </li>
            {user.role === "ADMIN" && (
              <li>
                <Link
                  to="/resources/accessrequests"
                  className={linkClass("/resources/accessrequests")}
                >
                  <span className={iconClass("/resources/accessrequests")}>
                    <IconUsers />
                  </span>
                  Access Requests
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/resources/requests"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Requests
              </Link>
            </li>
            <li>
              <Link
                to="/resources/calendar"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconBox />
                </span>
                Calendar
              </Link>
            </li>
          </ul>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Procurement
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link
                to="/procurement/assets"
                className={linkClass("/procurement/assets")}
              >
                <span className={iconClass("/procurement/assets")}>
                  <Box className="w-5 h-5" />
                </span>
                Assets
              </Link>
            </li>
            <li>
              <Link
                to="/procurement/partsinventory"
                className={linkClass("/procurement/partsinventory")}
              >
                <span className={iconClass("/procurement/partsinventory")}>
                  <Box className="w-5 h-5" />
                </span>
                Parts Inventory
              </Link>
            </li>
            <li>
              <Link
                to="/procurement/inventory"
                className={linkClass("/procurement/inventory")}
              >
                <span className={iconClass("/procurement/inventory")}>
                  <Box className="w-5 h-5" />
                </span>
                IN/OUT Inventory
              </Link>
            </li>
          </ul>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Analytics
          </div>
          <ul className="space-y-0.5 px-2">
            <li>
              <a
                href="/analytics/metrics"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-400">
                  <IconUsers />
                </span>
                Metrics
              </a>
            </li>
          </ul>
        </nav>

        <Link
          to="/profile"
          className="p-4 border-t border-gray-200 flex items-center hover:bg-gray-100 transition-colors cursor-pointer block mt-auto shrink-0"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            {user.firstName.charAt(0)}
            {user.lastName?.charAt(0)}
          </div>
          <div className="ml-3 flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              View Profile
            </span>
          </div>
        </Link>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0 relative z-20">
          <input
            type="text"
            placeholder="Search..."
            className="pl-4 pr-4 py-1.5 border rounded-md text-sm w-64 outline-none"
          />

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                + Create
              </button>

              {isCreateMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCreateMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-40 overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        setIsModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                    >
                      Work Order
                    </button>
                    <button
                      onClick={() => setIsCreateMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                    >
                      Preventive Maintenance
                    </button>
                    <button
                      onClick={() => setIsCreateMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                    >
                      General Request
                    </button>
                    {user.role === "ADMIN" && (
                      <button
                        onClick={() => setIsCreateMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                      >
                        Access Request
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onSignOut}
              className="text-sm font-medium border px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* MAIN ROUTED CONTENT */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1">
            <Routes>
              {/* Workspace */}
              <Route
                path="/workspace/workorder/:id"
                element={<WorkOrderDetail user={user} />}
              />
              <Route
                path="/workspace/workorders"
                element={
                  <WorkOrders
                    user={user}
                    onOpenModal={() => setIsModalOpen(true)}
                  />
                }
              />
              <Route
                path="/workspace/pm"
                element={<PreventiveMaintenance user={user} />}
              />
              <Route path="/workspace/schedular" />

              {/* AI Search */}
              <Route path="/aisearch/pulseworksAI" />

              {/* Organization */}
              <Route path="/organization/locations" element={<Locations />} />
              <Route
                path="/organization/myteam"
                element={<MyTeam user={user} />}
              />

              {/* Resources */}
              <Route
                path="/resources/projects"
                element={<Project user={user} />}
              />
              <Route
                path="/resources/accessrequests"
                element={<Requests user={user} />}
              />

              {/* Procurement */}
              <Route
                path="/procurement/partsinventory"
                element={<PartsInventory user={user} />}
              />
              <Route
                path="/procurement/assets"
                element={<Assets user={user} />}
              />
              <Route
                path="/procurement/inventory"
                element={<Inventory user={user} />}
              />

              {/* Analytics */}
              <Route path="/analytics/metrics" />

              {/* Profile */}
              <Route path="/profile" element={<MyProfile user={user} />} />
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
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("koda_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("koda_user", JSON.stringify(u));
  };
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("koda_user");
  };

  return (
    <BrowserRouter>
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
              <UserProfile
                user={user}
                onUpdateUser={handleLogin}
                onSignOut={handleSignOut}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Main App Layout Guard */}
        <Route
          path="/*"
          element={
            user ? (
              user.approvalStatus === "PENDING" ? (
                <Navigate to="/userprofile" />
              ) : (
                <DashboardLayout user={user} onSignOut={handleSignOut} />
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
