import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";

export default function ResetPasswordPage() {
  const location = useLocation();
  const history = useHistory();
  const { email } = location.state || {};

  const [contactNumber, setContactNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post("/auth/first-login", {
  email,
  contactNumber,
  newPassword,
  confirmPassword,
  deviceType: "web",
});

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => history.push("/login"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d1b2a" }}>
      <header
        className="px-8 sm:px-12 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h1 className="text-white text-lg font-bold">Reset Password</h1>
      </header>

      <div className="flex-grow flex justify-center px-6 pt-10 pb-8">
        <div className="w-full max-w-[440px]">
          <h2 className="text-white text-2xl font-bold mb-4">Reset Your Password</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">Password reset successful! Redirecting to login...</p>}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-white mb-1">Contact Number</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-white mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>

      <footer
        className="px-8 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] text-center" style={{ color: "rgba(255,255,255,0.28)" }}>
          © 2026 Firmity. All rights reserved.
        </p>
      </footer>
    </div>
  );
}