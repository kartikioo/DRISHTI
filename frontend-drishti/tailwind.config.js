/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        drishti: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          accent: '#06b6d4',
          amber: '#f59e0b',
          danger: '#ef4444',
          yellow: '#facc15'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(34, 197, 94, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-yellow': '0 0 30px 2px rgba(250, 204, 21, 0.7)',
      }
    },
  },
  plugins: [],
}
