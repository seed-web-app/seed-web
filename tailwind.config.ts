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
        amazon: {
          header: "#171a1f",
          subnav: "#252a31",
          bg: "#f5f6f7",
          card: "#ffffff",
          yellow: "#ffd814",
          yellowHover: "#f7ca00",
          yellowBorder: "#fcd200",
          orange: "#ffa41c",
          orangeHover: "#fa8900",
          blue: "#007185",
          blueHover: "#c7511f",
          deal: "#cc0c39",
          border: "#d5d9d9",
          text: "#17191d",
          muted: "#626870",
          star: "#de7921",
          light: "#f7fafa",
        },
        suzuki: {
          red: "#E60012",
          darkred: "#9B000C",
          brightred: "#FF1F2F",
          black: "#131921",
          carbon: "#171A1F",
          slate: "#232f3e",
          muted: "#9CA3AF",
          primer: "#64748B",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
