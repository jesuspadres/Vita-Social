import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A365D",
          light: "#2A4A7F",
          dark: "#122848",
        },
        secondary: {
          DEFAULT: "#4A90A4",
          light: "#5DA8BD",
          dark: "#3A7487",
        },
        success: {
          DEFAULT: "#38A169",
          light: "#48BB78",
          dark: "#2F855A",
        },
        warning: {
          DEFAULT: "#D69E2E",
          light: "#ECC94B",
          dark: "#B7791F",
        },
        danger: {
          DEFAULT: "#E53E3E",
          light: "#FC8181",
          dark: "#C53030",
        },
        info: {
          DEFAULT: "#3182CE",
          light: "#63B3ED",
          dark: "#2B6CB0",
        },
        "badge-verified": "#38A169",
        "badge-id": "#3182CE",
        "badge-premium": "#D4AF37",
        "health-green": "#38A169",
        "health-yellow": "#D69E2E",
        "health-orange": "#DD6B20",
        "health-red": "#E53E3E",
        "health-gray": "#A0AEC0",
        "text-primary": "#1A202C",
        "text-secondary": "#718096",
        "text-inverse": "#F7FAFC",
        "bg-light": "#FFFFFF",
        "bg-dark": "#1A202C",
        "surface-light": "#F7FAFC",
        "surface-dark": "#2D3748",
      },
      fontFamily: {
        sans: ["Inter"],
        "inter-bold": ["Inter_700Bold"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-medium": ["Inter_500Medium"],
        "inter-regular": ["Inter_400Regular"],
        "inter-light": ["Inter_300Light"],
      },
    },
  },
  plugins: [],
} satisfies Config;
