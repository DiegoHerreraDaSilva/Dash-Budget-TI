import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta da logo Schwaben Engineering
        teal: {
          50: "#e6f6f8",
          100: "#c2e9ed",
          200: "#8fd6de",
          300: "#5cc3ce",
          400: "#27aebc",
          500: "#0098a8", // teal principal da logo
          600: "#007f8d",
          700: "#006370",
          800: "#004b55",
          900: "#00333a",
        },
        graphite: {
          50: "#f4f5f6",
          100: "#e6e8ea",
          200: "#cdd2d6",
          300: "#aab2b9",
          400: "#7d8891",
          500: "#5a646e", // cinza da logo
          600: "#48515a",
          700: "#3a424a",
          800: "#2b3138",
          900: "#1c2127",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
