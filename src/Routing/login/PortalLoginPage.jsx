import React, { useState } from "react";
import { Link, useParams, useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, KeyRound, FileSearch, Globe, ShieldCheck, Award } from "lucide-react";

/* ─── Local API ──────────────────────────────────────────────────── */
const API_BASE = "";
// const API_BASE = "http://admin.urest.in:8079";

/* ─── Config ─────────────────────────────────────────────────────── */
const portalConfig = {
  client: {
    label: "Client Portal",
    accent: "#1484bc",
    accentBg: "#eaf5fc",
  },
  employee: {
    label: "Employee Portal",
    accent: "#2e7d52",
    accentBg: "#e8f5ee",
  },
  facility: {
    label: "Facility Manager Portal",
    accent: "#c2792a",
    accentBg: "#fdf0e0",
  },
};

const certifications = [
  { id: 1, image: "/Assets/Certification1.svg",  alt: "Certification" },
  { id: 2, image: "/Assets/Certification2.svg",  alt: "TÜV" },
  { id: 3, image: "/Assets/Certification3.svg",  alt: "ISO 9001" },
  { id: 4, image: "/Assets/Certification4.svg",  alt: "ISO 27001" },
  { id: 5, image: "/Assets/CERTIFICATION6.webp", alt: "ISO 14001" },
  { id: 6, image: "/Assets/CERTIFICATION7.webp", alt: "ISO 41001" },
];

const trustFeatures = [
  { icon: Lock,       text: "End-to-end 256-bit SSL/TLS encryption" },
  { icon: KeyRound,   text: "Multi-factor authentication ready" },
  { icon: FileSearch, text: "Regular third-party security audits" },
  { icon: Globe,      text: "GDPR & data privacy compliant" },
];

const legalLinks = [
  { label: "Privacy Policy",  to: "/PrivacyPolicypage" },
  { label: "Security Policy", to: "/SecurityPolicyPage" },
  { label: "Terms of Use",    to: "/TermsofUsePage" },
];

function getLeftPanelStyle(portalKey) {
  const gradients = {
    client:
      "linear-gradient(135deg,rgba(13,26,42,0.94) 0%,rgba(18,35,54,0.97) 100%)",
    employee:
      "linear-gradient(135deg,rgba(8,28,16,0.93) 0%,rgba(12,42,22,0.97) 100%)",
    facility:
      "linear-gradient(135deg,rgba(40,18,4,0.93) 0%,rgba(55,24,5,0.97) 100%)",
  };
  const gradient = gradients[portalKey] ?? gradients.client;
  return {
    backgroundImage: `${gradient}, url('/Assets/carousel_1.webp')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function PortalLoginPage() {
  const { portal: portalKey = "client" } = useParams();
const history = useHistory();
  const portal = portalConfig[portalKey] ?? portalConfig.client;

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [errors,       setErrors]       = useState({});
  const [apiError,     setApiError]     = useState(null);

  const validate = () => {
    const next = {};
    if (!email.trim())    next.email    = "Email is required.";
    if (!password)        next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          deviceType: "web",
        }),
      });

      const data = await res.json();

  //     if (!res.ok) {
  //       // Surface the API error message if provided, otherwise generic
  //       setApiError(data?.message ?? "Invalid email or password.");
  //       return;
  //     }

  //     // Store tokens — adjust keys to match your actual API response shape
  //     localStorage.setItem("accessToken",  data.accessToken);
  //     localStorage.setItem("refreshToken", data.refreshToken);

  //     if (data.firstLogin) {
  //      history.push({ pathname: "/reset-password", state: { email } });
  //       return;
  //     }

  //     // Navigate to dashboard after successful login
  // history.push("/Account/App");

  //   } catch (err) {
  //     setApiError("Unable to reach the server. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  if (data?.error === "FIRST_LOGIN_REQUIRED") {
  history.push({ pathname: "/reset-password", state: { email: data.email } });
  return;
}
if (!res.ok) {
  setApiError(data?.message ?? "Invalid email or password.");
  return;
}
localStorage.setItem("accessToken", data.accessToken);
localStorage.setItem("refreshToken", data.refreshToken);
history.push("/Account/App");
} catch (err) {
  setApiError("Unable to reach the server. Please try again.");
} finally {
  setIsLoading(false);
}
};

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      <div className="flex-grow flex flex-col-reverse lg:flex-row overflow-hidden">

        {/* LEFT — Trust panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:w-[44%] flex flex-col px-8 sm:px-12 lg:px-14 pt-10 lg:pt-12 pb-8 overflow-y-auto"
          style={{ ...getLeftPanelStyle(portalKey), scrollbarWidth: "none" }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-4 w-fit cursor-default">
            <Award size={11} style={{ color: "#1484bc" }} />
            <span className="text-[9.5px] font-bold text-white/55 uppercase tracking-[0.15em]">
              Trusted Platform
            </span>
          </div>

          <div className="mb-3">
            <img
              src="/Assets/ufirmlogo.svg"
              alt="UFirm Estates"
              width={96}
              height={28}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.75 }}
            />
          </div>

          <h2 className="text-[1.3rem] font-bold text-white leading-snug tracking-tight mb-2">
            India's Leading Real Estate Technology Platform
          </h2>
          <p className="text-[12.5px] text-white/50 leading-relaxed mb-7">
            UFirm powers operations for real estate businesses across India — from
            facility management to asset tracking.
          </p>

          <div className="space-y-3.5 mb-7">
            {trustFeatures.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} style={{ color: "#1484bc" }} />
                </div>
                <span className="text-[12px] text-white/65">{text}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 mb-5" />

          <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">
            Certifications &amp; Compliance
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="relative w-[46px] h-[46px] flex-shrink-0 bg-white rounded-[6px] shadow-md flex items-center justify-center"
              >
                <img src={cert.image} alt={cert.alt} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6px" }} />
              </div>
            ))}
          </div>

          <div className="mt-auto pt-7 flex items-center gap-1.5 text-[10.5px] text-white/28">
            <ShieldCheck size={10} style={{ color: "#1484bc" }} />
            <span>256-bit SSL/TLS · SOC 2 ready</span>
          </div>
        </motion.div>

        {/* RIGHT — Login form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="lg:w-[56%] flex flex-col px-8 sm:px-12 lg:px-16 pt-10 lg:pt-12 pb-8 bg-white overflow-y-auto border-b lg:border-b-0 lg:border-l border-gray-100"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="cursor-pointer">
              <img
                src="/Assets/firmitylogo.svg"
                alt="Firmity"
                width={82}
                height={28}
                style={{ objectFit: "contain", filter: "brightness(0.35)" }}
              />
            </Link>
            <Link
              to="/login"
              className="text-[12.5px] font-semibold underline underline-offset-2 hover:text-[#1484bc] transition-colors cursor-pointer"
              style={{ color: "#1e3143" }}
            >
              Go back
            </Link>
          </div>

          <div className="max-w-[340px] w-full">

            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 cursor-default"
              style={{ backgroundColor: portal.accentBg }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: portal.accent }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: portal.accent }}
              >
                {portal.label}
              </span>
            </div>

            <h1 className="text-[1.6rem] font-bold text-[#1e3143] leading-tight tracking-tight mb-1.5">
              Are you already registered?
            </h1>
            <p className="text-[13px] text-gray-500 mb-6">
              Sign in to continue to your account.
            </p>

            {/* API error banner */}
            {apiError && (
              <div className="mb-4 px-4 py-3 rounded-[6px] text-[12.5px] font-medium"
                style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* EMAIL */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.12em] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(p => ({ ...p, email: undefined }));
                  }}
                  className="w-full border-b-[1.5px] border-gray-300 bg-transparent py-2 text-[#1e3143] text-[14px] placeholder:text-gray-300 outline-none transition-colors duration-200"
                  style={{ borderColor: errors.email ? "#f87171" : undefined }}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="mb-3">
                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.12em] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                    }}
                    className="w-full border-b-[1.5px] border-gray-300 bg-transparent py-2 pr-7 text-[#1e3143] text-[14px] placeholder:text-gray-300 outline-none transition-colors duration-200"
                    style={{ borderColor: errors.password ? "#f87171" : undefined }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="mb-6 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-[#1e3143] underline underline-offset-2 hover:text-[#1484bc] transition-colors cursor-pointer font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-white text-[13.5px] font-bold rounded-[4px] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
                style={{ backgroundColor: portal.accent }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </>
                ) : "Log in"}
              </button>
            </form>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
              <Lock size={10} />
              <span>Secured with 256-bit SSL/TLS encryption</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-8 sm:px-12 py-3.5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <ShieldCheck size={10} style={{ color: "#1484bc" }} />
            <span>Secured by 256-bit SSL</span>
            <span className="text-gray-300 mx-1">·</span>
            <span>© 2026 Firmity. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[11px] text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}