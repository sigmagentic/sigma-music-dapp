/* eslint-disable @typescript-eslint/no-var-requires */
const { fontFamily } = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      "base": "0px",
      "sm": "450px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1200px",
      "2xl": "1500px",
      "3xl": "2300px",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1500px",
      },
    },
    extend: {
      colors: {
        black: "#0f0f0f",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        // clash: ["var(--font-clash)", ...fontFamily.clash],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "gradient": {
          to: { "background-position": "200% center" },
        },
        "cube-down": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(10px)" },
          "100%": { transform: "translateY(0px)" },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0) scale(1)",
            filter: "brightness(1) opacity(0.95)",
          },
          "50%": {
            transform: "translateY(-10px) scale(1.01)",
            filter: "brightness(1.2) opacity(1)",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideFadeIn: {
          "0%": {
            transform: "translateX(-20px)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        pointer: {
          "0%, 100%": { transform: "translateY(0) translateX(-50%)" },
          "50%": { transform: "translateY(-20px) translateX(-50%)" },
        },
        "text-gradient": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "0% 50%",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "100% 50%",
          },
        },
        "text-shimmer": {
          "0%": {
            transform: "translateY(0)",
            filter: "brightness(1)",
          },
          "50%": {
            transform: "translateY(-2px)",
            filter: "brightness(1.2)",
          },
          "100%": {
            transform: "translateY(0)",
            filter: "brightness(1)",
          },
        },
        "border-rotate": {
          "0%": { transform: "rotate(0deg) scale(10)" },
          "100%": { transform: "rotate(-360deg) scale(10)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin 4s linear infinite",
        "gradient": "gradient 10s linear infinite",
        "cube-down": "cube-down 1s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-random": "pulse-random 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-fade-in": "slideFadeIn 0.5s ease-out",
        "shake": "shake 0.8s cubic-bezier(.36,.07,.19,.97) 10",
        "point": "pointer 2s ease-in-out infinite",
        "text-gradient": "text-gradient 8s ease infinite",
        "text-shimmer": "text-shimmer 4s ease-in-out infinite",
        "border-rotate": "border-rotate 4s linear infinite",
      },
    },
  },

  plugins: [require("tailwindcss-animate"), addVariablesForColors],
};
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]));

  addBase({
    ":root": newVars,
  });
}
