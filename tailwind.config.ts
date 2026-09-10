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
        suzuki: {
          red: "#E60012",
          darkred: "#9B000C",
          brightred: "#FF1F2F",
          black: "#0A0D14",
          carbon: "#121722",
          slate: "#1C2433",
          border: "#2A3547",
          muted: "#94A3B8",
          primer: "#64748B",
          light: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
