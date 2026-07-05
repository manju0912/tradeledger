// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        brand: {
          accent: "#7c6af7",
          accent2: "#a78bfa",
          green: "#00d68f",
          "green-dim": "#00d68f22",
          "green-mid": "#00d68f55",
          red: "#ff4d6a",
          "red-dim": "#ff4d6a22",
          "red-mid": "#ff4d6a55",
          gold: "#f5c518",
          bg: "#0a0a0f",
          bg2: "#111118",
          bg3: "#16161f",
          bg4: "#1c1c28",
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease forwards",
        "slide-up": "slide-up 0.25s ease forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
