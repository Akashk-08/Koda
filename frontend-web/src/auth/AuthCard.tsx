import React, { useState } from "react";

interface AuthCardProps {
  onAuthSuccess: (user: unknown) => void;
}

const AuthCard = ({ onAuthSuccess }: AuthCardProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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

    // Client-side Validation for Signup
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg("Passwords do not match!");
        return;
      }
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";

    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.user || data); // Handles both login and signup responses
      } else {
        setErrorMsg(data.error || "Authentication failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setErrorMsg("Failed to connect to the server.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Koda Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 mb-2">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Sign in to Koda" : "Create your Koda account"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? "Enter your details below to continue" : "."}
          </p>
        </div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SIGNUP ONLY FIELDS */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  type="text"
                  placeholder="e.g. Koda LLC"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    type="text"
                    placeholder="First Name"
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    type="text"
                    placeholder="Last Name"
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {/* SHARED FIELDS (Email & Password) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Email
            </label>
            <input
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              type="email"
              placeholder="name@company.com"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              type="password"
              placeholder="••••••••"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* SIGNUP ONLY FIELD */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                type="password"
                placeholder="••••••••"
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors mt-2"
          >
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline w-full text-center font-medium"
          >
            {isLogin
              ? "Don't have an account? Set up your Organization"
              : "Already have an account? Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
