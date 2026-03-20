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
        navy: {
          DEFAULT: "#0F1F3D",
          50: "#E8EDF5",
          100: "#C5D0E6",
          200: "#8FA5CC",
          300: "#5A7AB2",
          400: "#2D5099",
          500: "#0F1F3D",
          600: "#0B1830",
          700: "#081023",
          800: "#050B17",
          900: "#02050A",
        },
        cream: "#FAFAF8",
        brand: {
          blue:  'rgb(108, 194, 255)',  // PRIMARY — buttons, active states, progress
          pink:  'rgb(255, 118, 184)',  // SECONDARY — highlights, resume CTA
          green: 'rgb(112, 255, 162)', // SUCCESS — answered, complete, ticks
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#DFC070",
          dark: "#A8882E",
        },
        slate: {
          portal: "#64748B",
        },
      },
      fontFamily: {
        // Body text — readable, neutral
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Headings, labels, nav, display — Inter for consistency
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Keep serif as alias for display (backwards compat)
        serif: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 6px 16px -2px rgba(0,0,0,0.1), 0 2px 6px -2px rgba(0,0,0,0.06)",
        modal: "0 20px 60px rgba(15, 31, 61, 0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-right": "slideOutRight 0.3s ease-in",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
