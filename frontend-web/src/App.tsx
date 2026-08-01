/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link, useLocation } from "react-router-dom";

// Components
import Project from "./components/Project.jsx";
import WorkOrders from "./components/WorkOrders.jsx";
import PreventiveMaintenance from "./components/PreventiveMaintenance.jsx";
import DashboardHome from "./components/DashboardHome";
import WorkOrderDetail from "./components/WorkOrderDetail";
import CreateWorkOrderModal from "./components/CreateWorkOrderModal";
import UserProfile from "./components/UserProfile.jsx";
import Requests from "./components/AccessRequests.jsx";
import Locations from "./components/Locations.jsx";
import MyTeam from "./components/MyTeam.jsx";
import Footer from './components/Footer.jsx';
import MyProfile from "./components/MyProfile.jsx";
import LandingPage from "./components/LandingPage.jsx";

// --- INTERFACES ---
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  role?: string;
  approvalStatus?: string; // Added to enforce strict routing checks
}

interface AuthCardProps {
  initialMode: "login" | "signup";
  onAuthSuccess: (user: User) => void;
}

// --- ICONS ---
const IconGrid = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconList = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconBox = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconUsers = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;

// --- AUTH COMPONENT (REDESIGNED & FIXED) ---
const AuthCard = ({ initialMode, onAuthSuccess }: AuthCardProps) => {
  const isLogin = initialMode === "login"; 
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ organizationName: "", email: "", firstName: "", lastName: "", password: "", confirmPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) return setErrorMsg("Passwords do not match!");
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) { 
        onAuthSuccess(data.user || data); 
        navigate(isLogin ? "/dashboard" : "/userprofile"); 
      } else setErrorMsg(data.error || "Authentication failed");
    } catch (err) { setErrorMsg("Failed to connect to the server."); }
  };

  const inputClasses = "w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400";

  return (
    // Make the auth screen a flex column to hold the footer at the bottom
    <div className="min-h-screen flex flex-col bg-white font-sans">
      
      {/* Container for the left/right content which will grow and push the footer down */}
      <div className="flex-1 flex font-sans bg-white">
        
        {/* LEFT SIDE - BRANDING (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-10 shadow-xl">
              K
            </div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
              Streamline your<br/>maintenance operations.
            </h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">
              Koda CMMS helps your team track assets, manage preventive maintenance, and resolve work orders faster than ever.
            </p>
          </div>
          
          <div className="absolute -bottom-32 -left-40 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative overflow-y-auto">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-left mb-10">
              <div className="lg:hidden w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-6 shadow-lg">
                K
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {isLogin ? "Welcome back" : "Get started with Koda"}
              </h2>
              <p className="text-gray-500 text-sm">
                {isLogin ? "Please enter your details to sign in to your workspace." : "Create a new organization workspace for your team."}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50/80 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <input required className={inputClasses} type="text" placeholder="Organization Name" onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} />
                </div>
              )}
              
              {!isLogin && (
                <div className="flex gap-4">
                  <input required className={inputClasses} type="text" placeholder="First Name" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  <input required className={inputClasses} type="text" placeholder="Last Name" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              )}

              <div>
                <input required className={inputClasses} type="email" placeholder="Work Email for eg.(xyz@companyName.com)" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div>
                <input required className={inputClasses} type="password" placeholder="Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>

              {!isLogin && (
                <div>
                  <input required className={inputClasses} type="password" placeholder="Confirm Password" onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end mb-2">
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</a>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-6">
                {isLogin ? "Sign In" : "Create Workspace"}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center lg:text-left text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between">
              <span className="font-medium">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
              <button onClick={() => navigate(isLogin ? "/signup" : "/login")} className="mt-3 sm:mt-0 font-bold text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 hover:bg-blue-50 rounded-lg">
                {isLogin ? "Create an account" : "Sign in to existing workspace"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add the Footer here at the bottom of the auth screen */}
      <Footer />
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ user, onSignOut }: { user: User; onSignOut: () => void; }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // DROPDOWN MENU STATE
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/workorders?orgId=${user?.organizationId}`);
      if (response.ok) setWorkOrders(await response.json());
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") fetchWorkOrders();
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-white text-gray-800 font-sans">
      
      {/* RESTORED FULL SIDEBAR */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200 font-bold text-lg">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white mr-3">K</div> Koda CMMS
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspace</div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link to="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-blue-700 bg-blue-50">
                <span className="mr-3 text-blue-600"><IconGrid /></span>Dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/workorders" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconList /></span>Work Orders
              </Link>
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconList /></span>AI Search
              </a>
            </li>
            <li>
              <Link to="/dashboard/pm" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconBox /></span>Preventive Maintenance
              </Link>
            </li>
              <li>
              <Link to="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconBox /></span>Schedular
              </Link>
            </li>
          </ul>

          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link to="/dashboard/myteam" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconUsers /></span>My Team
              </Link>
              <Link to="/dashboard/locations" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconUsers /></span>Locations
              </Link>
            </li>
          </ul>
          
          <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Resources</div>
          <ul className="space-y-0.5 px-2">
            <li>
              <Link to="/dashboard/projects" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconList /></span>Projects
              </Link>
            </li>
            <li>
              {user.role === 'ADMIN' && (
                <li>
                  <Link to="/dashboard/accessrequests" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                    <span className="mr-3 text-gray-400"><IconUsers /></span>Access Requests
                  </Link>
                </li>
              )}
              <Link to="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconBox /></span>Requests
              </Link>
              <Link to="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconList /></span>Plans
              </Link>
              <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <span className="mr-3 text-gray-400"><IconUsers /></span>Calendar
              </a>
            </li>
            
            <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Procurement</div>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
              <span className="mr-3 text-gray-400"><IconUsers /></span>Parts Inventory
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
              <span className="mr-3 text-gray-400"><IconUsers /></span>Inventory
            </a>

            <div className="px-3 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analytics</div>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
              <span className="mr-3 text-gray-400"><IconUsers /></span>Metrics
            </a>
          </ul>
        </nav>
        
        <Link to="/dashboard/profile" className="p-4 border-t border-gray-200 flex items-center hover:bg-gray-100 transition-colors cursor-pointer block mt-auto shrink-0">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            {user.firstName.charAt(0)}{user.lastName?.charAt(0)}
          </div>
          <div className="ml-3 flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-gray-500 font-medium">View Profile</span>
          </div>
        </Link>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0 relative z-20">
          <input type="text" placeholder="Search..." className="pl-4 pr-4 py-1.5 border rounded-md text-sm w-64 outline-none" />
          
          <div className="flex items-center space-x-4">
            
            {/* NEW DROPDOWN CONTAINER */}
            <div className="relative">
              <button 
                onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                + Create
              </button>

              {/* DROPDOWN MENU */}
              {isCreateMenuOpen && (
                <>
                  {/* Invisible overlay to close menu when clicking outside */}
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
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        // Future implementation: Open PM Modal
                      }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                    >
                      Preventive Maintenance
                    </button>
                    <button 
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        // Future implementation: Open Request Modal
                      }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                    >
                      General Request
                    </button>
                    
                    {user.role === 'ADMIN' && (
                      <button 
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          // Future implementation: Open Access Request
                        }} 
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors border-t border-gray-50"
                      >
                        Access Request
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <button onClick={onSignOut} className="text-sm font-medium border px-4 py-1.5 rounded-md hover:bg-gray-50 transition-colors">Sign Out</button>
          </div>
        </header>

        {/* The main scrollable content area. Flex column holds routes at top, footer at bottom */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardHome workOrders={workOrders} isLoading={isLoading} onOpenModal={() => setIsModalOpen(true)} />} />
              <Route path="/workorder/:id" element={<WorkOrderDetail user={user} />} />
              <Route path="/workorders" element={<WorkOrders user={user} onOpenModal={() => setIsModalOpen(true)} />} />
              <Route path="/projects" element={<Project user={user} />} />
              <Route path="/pm" element={<PreventiveMaintenance user={user} />} />
              <Route path="/accessrequests" element={<Requests user={user} />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/myteam" element={<MyTeam user={user} />} />
              <Route path="/profile" element={<MyProfile user={user} />} />
            </Routes>
          </div>
          
          {/* Dashboard Footer sits at the bottom of the scrollable content */}
          <Footer />
        </main>

        <CreateWorkOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} onCreated={fetchWorkOrders} />
      </div>
    </div>
    
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("koda_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => { setUser(u); localStorage.setItem("koda_user", JSON.stringify(u)); };
  const handleSignOut = () => { setUser(null); localStorage.removeItem("koda_user"); };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthCard initialMode="login" onAuthSuccess={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/userprofile" /> : <AuthCard initialMode="signup" onAuthSuccess={handleLogin} />} />
        <Route path="/userprofile" element={user ? <UserProfile user={user} onUpdateUser={handleLogin} onSignOut={handleSignOut} /> : <Navigate to="/login" />} />
        <Route path="/dashboard/*" element={
          user 
            ? (user.approvalStatus === 'PENDING' ? <Navigate to="/userprofile" /> : <Dashboard user={user} onSignOut={handleSignOut} />) 
            : <Navigate to="/login" />
        } />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}