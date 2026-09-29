/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Eye, EyeOff } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080";

interface LoginProps {
  onAuthSuccess: (user: any) => void;
}

export default function Login({ onAuthSuccess }: LoginProps) {
  const [mode, setMode] = useState("login");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [pin, setPin] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    resetCode: "",
  });

  useEffect(() => {
    const kioskEmail = sessionStorage.getItem("koda_kiosk_email");
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
            sessionStorage.removeItem("koda_kiosk_email");
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
          body: JSON.stringify({ email: formData.email, password: formData.password }),
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
          body: JSON.stringify({ email: formData.email, profileId: selectedProfile.id, pin }),
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
          body: JSON.stringify({ email: formData.email, code: formData.resetCode }),
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
          setFormData({ ...formData, password: "", confirmPassword: "", resetCode: "" });
        } else {
          setErrorMsg("Failed to reset password.");
        }
      }
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
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                {mode === "login" && "Welcome back"}
                {mode === "forgot_email" && "Reset Password"}
                {mode === "forgot_code" && "Verify Code"}
                {mode === "forgot_reset" && "Create New Password"}
                {mode === "select_profile" && "Who is using the device?"}
                {mode === "pin_entry" && `Welcome, ${selectedProfile?.firstName}`}
              </h2>
              <p className="text-gray-500 text-sm">
                {mode === "login" && "Please enter your details to sign in to your workspace."}
                {mode === "forgot_email" && "Enter your email address and we'll send you a 4-digit code."}
                {mode === "forgot_code" && `Enter the 4-digit code sent to ${formData.email}`}
                {mode === "forgot_reset" && "Please enter a strong new password."}
                {mode === "select_profile" && "Select your profile to continue."}
                {mode === "pin_entry" && "Please enter your 4-digit security PIN."}
              </p>
            </div>

            {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r-lg">{errorMsg}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm font-medium rounded-r-lg">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "select_profile" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {subUsers.map((profile) => (
                      <button key={profile.id} type="button" onClick={() => { setSelectedProfile(profile); setMode("pin_entry"); }} className="p-6 border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center gap-3 bg-gray-50 hover:bg-white">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                          {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{profile.firstName}</span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-center">
                    <button type="button" onClick={() => { sessionStorage.removeItem("koda_kiosk_email"); setSubUsers([]); setMode("login"); }} className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Sign Out of Device
                    </button>
                  </div>
                </div>
              )}

              {mode === "pin_entry" && (
                <div className="space-y-6">
                  <input required autoFocus className={`${inputClasses} text-center tracking-[1em] text-3xl font-black`} type="password" maxLength={4} placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
                  <div className="flex gap-4">
                    <button type="button" onClick={() => { setMode("select_profile"); setPin(""); }} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 p-3.5 rounded-xl font-bold transition-all">Back</button>
                    <button type="submit" className="w-2/3 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3.5 rounded-xl font-bold shadow-md">Login</button>
                  </div>
                </div>
              )}

              {(mode === "login" || mode === "forgot_email") && (
                <input required className={inputClasses} type="email" placeholder="Work Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              )}

              {(mode === "login" || mode === "forgot_reset") && (
                <div className="relative">
                  <input required className={inputClasses} type={showPassword ? "text" : "password"} placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              {mode === "forgot_reset" && (
                <div className="relative">
                  <input required className={inputClasses} type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                </div>
              )}

              {mode === "forgot_code" && (
                <input required className={`${inputClasses} text-center tracking-[1em] text-2xl font-black`} type="text" maxLength={4} placeholder="0000" onChange={(e) => setFormData({ ...formData, resetCode: e.target.value })} />
              )}

              {mode === "login" && (
                <div className="flex justify-end mb-2">
                  <button type="button" onClick={() => { setMode("forgot_email"); setErrorMsg(""); }} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Forgot password?</button>
                </div>
              )}

              {mode !== "select_profile" && mode !== "pin_entry" && (
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3.5 rounded-xl font-bold shadow-md hover:shadow-lg mt-6 border-0">
                  {mode === "login" ? "Sign In" : mode === "forgot_email" ? "Send Code" : mode === "forgot_code" ? "Verify Code" : "Update Password"}
                </button>
              )}
            </form>

            <div className="mt-10 pt-6 border-t border-gray-100 text-center lg:text-left text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between">
              {mode === "login" ? (
                <>
                  <span className="font-medium">Don't have an account?</span>
                  <button onClick={() => navigate("/signup")} className="font-bold text-blue-600 hover:text-blue-800 px-4 py-2 hover:bg-blue-50 rounded-lg">Create an account</button>
                </>
              ) : (
                <button onClick={() => setMode("login")} className="mx-auto font-bold text-blue-600 hover:text-blue-800 px-4 py-2 hover:bg-blue-50 rounded-lg">Return to Login</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}