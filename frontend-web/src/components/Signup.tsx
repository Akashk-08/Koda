import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

interface SignupProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAuthSuccess: (user: any) => void;
}

export default function Signup({ onAuthSuccess }: SignupProps) {
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      return setErrorMsg("Passwords do not match!");
    }

    try {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setErrorMsg("Failed to connect to the server.");
    }
  };

  const inputClasses = "w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-800 placeholder-gray-400";

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <div className="flex-1 flex font-sans bg-white">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-purple-700 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-10 shadow-xl">PW</div>
            <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">Streamline your<br />maintenance operations.</h1>
            <p className="text-blue-100 text-lg max-w-md leading-relaxed">Pulseworks CMMS helps your team track assets, manage preventive maintenance, and resolve work orders faster than ever.</p>
          </div>
          <div className="absolute -bottom-32 -left-40 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative overflow-y-auto">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center lg:text-left mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Get started with Pulseworks CMMS</h2>
              <p className="text-gray-500 text-sm">Create a new organization workspace for your team.</p>
            </div>

            {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required className={inputClasses} type="text" placeholder="Organization Name" onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })} />
              
              <div className="flex gap-4">
                <input required className={inputClasses} type="text" placeholder="First Name" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                <input required className={inputClasses} type="text" placeholder="Last Name" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>

              <input required className={inputClasses} type="email" placeholder="Work Email" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

              <div className="relative">
                <input required className={inputClasses} type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <input required className={inputClasses} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3.5 rounded-xl font-bold shadow-md hover:shadow-lg mt-6 border-0">
                Create Workspace
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center lg:text-left text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between">
              <span className="font-medium">Already have an account?</span>
              <button onClick={() => navigate("/login")} className="font-bold text-blue-600 hover:text-blue-800 px-4 py-2 hover:bg-blue-50 rounded-lg">Sign in to existing workspace</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}