/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obs: {
          bg: "#07090e",
          card: "rgba(15, 23, 42, 0.75)",
          cardHover: "rgba(30, 41, 59, 0.85)",
          border: "rgba(56, 189, 248, 0.15)",
          borderHover: "rgba(56, 189, 248, 0.35)",
          cyan: "#06b6d4",
          cyanGlow: "rgba(6, 182, 212, 0.4)",
          amber: "#f59e0b",
          amberGlow: "rgba(245, 158, 11, 0.4)",
          emerald: "#10b981",
          rose: "#f43f5e",
          purple: "#a855f7",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.45)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 18s linear infinite',
      }
    },
  },
  plugins: [],
}
