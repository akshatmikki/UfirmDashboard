import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, User, Briefcase, ArrowRight, ShieldCheck } from "lucide-react";

const portals = [
  {
    key: "client",
    icon: Building2,
    label: "Client Portal",
    description: "Property dashboards, analytics and real estate insights.",
    accent: "#1484bc",
    hoverBg: "rgba(20,132,188,0.14)",
    hoverBorder: "rgba(20,132,188,0.45)",
    iconBg: "rgba(20,132,188,0.18)",
  },
  {
    key: "employee",
    icon: User,
    label: "Employee Portal",
    description: "Assignments, timesheets and internal operations.",
    accent: "#2e7d52",
    hoverBg: "rgba(46,125,82,0.14)",
    hoverBorder: "rgba(46,125,82,0.45)",
    iconBg: "rgba(46,125,82,0.18)",
  },
  {
    key: "facility",
    icon: Briefcase,
    label: "Facility Manager Portal",
    description: "Maintenance requests, compliance and facility operations.",
    accent: "#c2792a",
    hoverBg: "rgba(194,121,42,0.14)",
    hoverBorder: "rgba(194,121,42,0.45)",
    iconBg: "rgba(194,121,42,0.18)",
  },
];

export default function LoginSelectorPage() {
  const [hoveredPortal, setHoveredPortal] = useState(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d1b2a" }}>

      {/* Header */}
      <header
        className="px-8 sm:px-12 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link to="/" className="cursor-pointer">
          <img
            src="/Assets/ufirmlogo.svg"
            alt="UFirm"
            width={80}
            height={30}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.8 }}
          />
        </Link>
        <Link
          to="/"
          className="text-sm font-medium transition-colors cursor-pointer"
          style={{ color: "rgba(255,255,255,0.45)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
        >
          ← Back to main site
        </Link>
      </header>

      {/* Content */}
      <div className="flex-grow flex justify-center px-6 pt-10 pb-8">
        <div className="w-full max-w-[440px]">

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38 }}
            className="mb-7"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-4 cursor-default"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <ShieldCheck size={12} style={{ color: "#1484bc" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                Secure Access
              </span>
            </div>

            <h1
              className="text-[1.85rem] font-bold tracking-tight leading-tight mb-2"
              style={{ color: "#ffffff" }}
            >
              Sign in to UFirm
            </h1>
            <p className="text-[13.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Select the portal you would like to access.
            </p>
          </motion.div>

          {/* Portal cards */}
          <div className="space-y-2.5">
            {portals.map((portal, i) => {
              const Icon = portal.icon;
              const isHovered = hoveredPortal === portal.key;

              return (
                <motion.div
                  key={portal.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.06 + i * 0.07 }}
                >
                  <Link
                    to={`/login/${portal.key}`}
                    className="flex items-center gap-4 w-full rounded-[8px] px-5 py-4 transition-all duration-200 group cursor-pointer"
                    style={{
                      borderStyle: "solid",
                      borderWidth: "1px",
                      borderLeftWidth: "4px",
                      borderColor: isHovered ? portal.hoverBorder : "rgba(255,255,255,0.1)",
                      borderLeftColor: portal.accent,
                      backgroundColor: isHovered ? portal.hoverBg : "rgba(255,255,255,0.04)",
                      boxShadow: isHovered ? `0 4px 24px ${portal.accent}28` : "none",
                      textDecoration: "none",
                    }}
                    onMouseEnter={() => setHoveredPortal(portal.key)}
                    onMouseLeave={() => setHoveredPortal(null)}
                  >
                    <div
                      className="w-10 h-10 rounded-[7px] flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: isHovered ? portal.iconBg : "rgba(255,255,255,0.08)" }}
                    >
                      <Icon size={18} style={{ color: portal.accent }} />
                    </div>
                    <div className="flex-grow text-left">
                      <p
                        className="text-[13.5px] font-semibold mb-0.5 transition-colors duration-200"
                        style={{ color: isHovered ? "#ffffff" : "rgba(255,255,255,0.88)" }}
                      >
                        {portal.label}
                      </p>
                      <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {portal.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={15}
                      className="flex-shrink-0 transition-all duration-200"
                      style={{
                        color: isHovered ? portal.accent : "rgba(255,255,255,0.2)",
                        transform: isHovered ? "translateX(2px)" : "translateX(0)",
                      }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-7 text-center text-[12px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            Need help?{" "}
            <Link
              to="/ContactPage"
              className="font-semibold hover:underline cursor-pointer"
              style={{ color: "#1484bc" }}
            >
              Contact Support
            </Link>
          </motion.p>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="px-8 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-[440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>
            © 2026 Firmity. All rights reserved.
          </p>
          <div className="flex gap-4">
            {[
              { label: "Privacy",  to: "/PrivacyPolicypage" },
              { label: "Security", to: "/SecurityPolicyPage" },
              { label: "Terms",    to: "/TermsofUsePage" },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[11px] transition-colors cursor-pointer"
                style={{ color: "rgba(255,255,255,0.28)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}