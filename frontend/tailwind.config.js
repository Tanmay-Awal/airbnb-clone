/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        airbnb: {
          red: '#FF385C',
          darkRed: '#E00B41',
          black: '#222222',
          grey: '#717171',
          lightGrey: '#F7F7F7',
          border: '#DDDDDD',
        },
      },
      boxShadow: {
        'airbnb-search': '0 3px 12px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)',
        'airbnb-card': '0 6px 16px rgba(0,0,0,0.12)',
        'airbnb-modal': '0 8px 28px rgba(0,0,0,0.28)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};