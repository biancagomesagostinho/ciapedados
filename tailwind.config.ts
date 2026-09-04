import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        "bg-edge": "rgb(var(--bg-edge) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        risk: {
          alto: "rgb(var(--risk-alto) / <alpha-value>)",
          medio: "rgb(var(--risk-medio) / <alpha-value>)",
          futuro: "rgb(var(--risk-futuro) / <alpha-value>)",
          baixo: "rgb(var(--risk-baixo) / <alpha-value>)",
        },
      },
      borderRadius: {
        card: "0.75rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
