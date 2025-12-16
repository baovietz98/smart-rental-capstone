/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "claude-bg": "#FBF9F6",
        "claude-text": "#383838",
        "claude-accent": "#DA7756",
        "claude-border": "#E5E0D8",
      },
      fontFamily: {
        serif: ["Merriweather_700Bold", "serif"],
        sans: ["Inter_400Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
};
