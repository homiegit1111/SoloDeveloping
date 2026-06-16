import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solo Leveling "System" palette — deep void blue + electric mana
        void: {
          900: "#05060f",
          800: "#0a0c1b",
          700: "#10132a",
          600: "#171b3a",
          500: "#1f2450",
        },
        mana: {
          DEFAULT: "#3da9fc",
          glow: "#6fd3ff",
          deep: "#1b6fd4",
        },
        arise: "#8a5cf6", // purple shadow-monarch
        ember: "#ff4d5e", // punishment red
        gold: "#ffce54", // reward gold
        jade: "#39d98a", // success green
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        mana: "0 0 24px rgba(61,169,252,0.45)",
        arise: "0 0 32px rgba(138,92,246,0.5)",
        ember: "0 0 28px rgba(255,77,94,0.5)",
        gold: "0 0 28px rgba(255,206,84,0.5)",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        scan: "scan 3.5s linear infinite",
        shake: "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
