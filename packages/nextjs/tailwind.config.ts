/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],

  // keep your current keys to avoid changing structure
  darkTheme: "dark",

  themes: [
    {
      light: {
        // ---- Brand / core palette (Clean + Red) ----
        primary: "#DC2626", // red-600
        "primary-content": "#FFFFFF",

        secondary: "#0F172A", // slate-900
        "secondary-content": "#FFFFFF",

        accent: "#FCA5A5", // red-300 (soft accent)
        "accent-content": "#7F1D1D", // red-900-ish text

        neutral: "#111827", // gray-900
        "neutral-content": "#FFFFFF",

        // ---- Surfaces ----
        "base-100": "#FFFFFF",
        "base-200": "#F8FAFC", // slate-50
        "base-300": "#E5E7EB", // gray-200
        "base-content": "#0F172A", // slate-900

        // ---- States ----
        info: "#0284C7", // sky-600
        success: "#16A34A", // green-600
        warning: "#F59E0B", // amber-500
        error: "#EF4444", // red-500

        // ---- Your existing custom tokens (kept; re-skinned clean) ----
        ".bg-gradient-modal": {
          "background-image":
            "linear-gradient(180deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 255, 255, 0.95) 70%)",
        },
        ".bg-modal": {
          background:
            "linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)",
        },
        ".modal-border": {
          border: "1px solid rgba(229, 231, 235, 1)", // gray-200
        },

        ".bg-gradient-nav": {
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(10px)",
        },

        ".bg-main": {
          background: "#FFFFFF",
        },
        ".bg-underline": {
          background:
            "linear-gradient(90deg, rgba(220, 38, 38, 0.35) 0%, rgba(220, 38, 38, 0.05) 100%)",
        },
        ".bg-container": {
          background: "transparent",
        },
        ".bg-btn-wallet": {
          "background-image":
            "linear-gradient(180deg, #DC2626 0%, #B91C1C 100%)",
        },
        ".bg-input": {
          background: "rgba(15, 23, 42, 0.04)", // slate-900 @ 4%
        },
        ".bg-component": {
          background: "rgba(255, 255, 255, 0.8)",
        },
        ".bg-function": {
          background: "rgba(220, 38, 38, 0.10)",
        },
        ".text-function": {
          color: "#DC2626",
        },
        ".text-network": {
          color: "#475569", // slate-600
        },

        // keep to avoid button shape regressions (you can change later)
        "--rounded-btn": "9999rem",

        ".tooltip": {
          "--tooltip-tail": "6px",
        },
        ".link": {
          textUnderlineOffset: "2px",
        },
        ".link:hover": {
          opacity: "80%",
        },
        ".contract-content": {
          background: "#FFFFFF",
        },
      },
    },
    {
      dark: {
        // ---- Dark mode version of the same clean system ----
        primary: "#EF4444", // red-500 reads better on dark
        "primary-content": "#0B0F19",

        secondary: "#E5E7EB",
        "secondary-content": "#0B0F19",

        accent: "#FCA5A5",
        "accent-content": "#0B0F19",

        neutral: "#E5E7EB",
        "neutral-content": "#0B0F19",

        "base-100": "#0B0F19", // near-slate-950
        "base-200": "#0F172A", // slate-900
        "base-300": "#111827", // gray-900
        "base-content": "#E5E7EB", // gray-200

        info: "#38BDF8",
        success: "#22C55E",
        warning: "#FBBF24",
        error: "#F87171",

        ".bg-gradient-modal": {
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(11, 15, 25, 0.92) 100%)",
        },
        ".bg-modal": {
          background:
            "linear-gradient(180deg, rgba(17, 24, 39, 0.85) 0%, rgba(11, 15, 25, 0.85) 100%)",
        },
        ".modal-border": {
          border: "1px solid rgba(255, 255, 255, 0.10)",
        },

        ".bg-gradient-nav": {
          "background-image":
            "linear-gradient(180deg, rgba(11, 15, 25, 0.75) 0%, rgba(11, 15, 25, 0.55) 100%)",
          backdropFilter: "blur(10px)",
        },

        ".bg-main": {
          background: "#0B0F19",
        },
        ".bg-underline": {
          background: "rgba(239, 68, 68, 0.35)",
        },
        ".bg-container": {
          background: "#0B0F19",
        },
        ".bg-btn-wallet": {
          "background-image":
            "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)",
        },
        ".bg-input": {
          background: "rgba(255, 255, 255, 0.06)",
        },
        ".bg-component": {
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(11, 15, 25, 0.72) 100%)",
        },
        ".bg-function": {
          background: "rgba(239, 68, 68, 0.14)",
        },
        ".text-function": {
          color: "#FCA5A5",
        },
        ".text-network": {
          color: "#94A3B8", // slate-400
        },

        "--rounded-btn": "9999rem",

        ".tooltip": {
          "--tooltip-tail": "6px",
          "--tooltip-color": "oklch(var(--p))",
        },
        ".link": {
          textUnderlineOffset: "2px",
        },
        ".link:hover": {
          opacity: "80%",
        },
        ".contract-content": {
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(11, 15, 25, 0.72) 100%)",
        },
      },
    },
  ],

  theme: {
    extend: {
      boxShadow: {
        // cleaner, more “premium” shadow
        center: "0 10px 30px -12px rgb(2 6 23 / 0.20)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        // swap your gradients to match the clean red inspiration
        "gradient-light":
          "linear-gradient(180deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 255, 255, 0.95) 70%)",
        "gradient-dark":
          "linear-gradient(180deg, rgba(239, 68, 68, 0.18) 0%, rgba(11, 15, 25, 0.0) 70%)",
        "gradient-vertical":
          "linear-gradient(180deg, #DC2626 0%, #B91C1C 100%)",
        "gradient-icon": "linear-gradient(90deg, #DC2626 0%, #F87171 100%)",
      },
    },
  },
};
