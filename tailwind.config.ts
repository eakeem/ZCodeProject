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
        // Calm, respectful memorial palette
        ink: {
          50: "#f6f5f3",
          100: "#e8e6e1",
          200: "#d2cec4",
          300: "#b3ac9d",
          400: "#928877",
          500: "#786e5e",
          600: "#5f5849",
          700: "#4a4439",
          800: "#332f28",
          900: "#1f1c18",
        },
        candle: {
          50: "#fff8ed",
          100: "#ffefd4",
          200: "#ffdba8",
          300: "#ffc070",
          400: "#ff9b37",
          500: "#ff800f",
          600: "#f06606",
          700: "#c74c07",
          800: "#9e3c0e",
          900: "#7f330f",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e3ebe4",
          200: "#c7d8ca",
          300: "#9ebba2",
          400: "#719a79",
          500: "#527d5c",
          600: "#3f6347",
          700: "#34503b",
          800: "#2c4032",
          900: "#26362b",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-1deg)", opacity: "1" },
          "50%": { transform: "scale(1.05) rotate(1deg)", opacity: "0.92" },
        },
        floatUp: {
          "0%": { transform: "translateY(0)", opacity: "0.9" },
          "100%": { transform: "translateY(-60px)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flicker: "flicker 0.6s ease-in-out infinite",
        fadeIn: "fadeIn 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
