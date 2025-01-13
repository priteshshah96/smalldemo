/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    // Background colors for buttons and hover states
    {
      pattern: /(bg|hover:bg|focus:ring)-(blue|emerald|violet|amber|fuchsia|purple|indigo|sky|teal|yellow|red|rose|gray)-(100|200|300|400|500)/,
    },
    // Text colors
    {
      pattern: /text-(blue|emerald|violet|amber|fuchsia|purple|indigo|sky|teal|yellow|red|rose|gray)-(400|500|600|700|800|900)/,
    }
  ],
  plugins: [],
}