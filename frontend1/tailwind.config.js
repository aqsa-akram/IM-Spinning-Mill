/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0F172A', // Deep Navy
          800: '#1E293B',
          700: '#334155',
          500: '#3B82F6',
        },
        accent: {
          gold: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}