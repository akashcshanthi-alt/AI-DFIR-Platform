/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-main": "#060913",
        "bg-secondary": "#0a0f1d",
        "bg-sidebar": "#04070e",
        "bg-surface": "#0e1626",
        "bg-surface-elevated": "#162035",
        "color-primary": "#3b82f6",
        "color-primary-hover": "#2563eb",
        "color-secondary": "#06b6d4",
        "text-primary": "#f8fafc",
        "text-secondary": "#cbd5e1",
        "text-muted": "#64748b",
      },
      borderRadius: {
        "radius-sm": "4px",
        "radius-md": "8px",
        "radius-lg": "12px",
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}
