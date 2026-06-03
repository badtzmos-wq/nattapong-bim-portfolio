/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f7f5f0",
        ink: "#18202b",
        muted: "#667085",
        line: "#ded8cc",
        panel: "#fffdf8",
        blue: {
          quiet: "#1f5f8b",
          soft: "#e8f1f7",
          deep: "#123c5a"
        },
        clay: "#a65f41",
        moss: "#49675a"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 32, 43, 0.08)"
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Aptos", "Segoe UI", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
