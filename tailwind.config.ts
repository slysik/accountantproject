import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#121413",
          secondary: "#1A1D1C",
          tertiary: "#2C302E",
        },
        border: {
          primary: "#363A38",
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#A8A8A8",
          muted: "#707070",
        },
        accent: {
          primary: "#F8D448",
          dark: "#E4C040",
        },
        success: "#50E3C2",
        error: "#FF4F4F",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
