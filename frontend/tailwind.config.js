/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'subway-green': '#008C15',
        'subway-green-dark': '#006B10',
        'subway-yellow': '#FFC214',
      },
    },
  },
  plugins: [],
} 