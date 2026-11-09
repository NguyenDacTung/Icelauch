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
        ice: {
          bg: '#0F1115',
          card: '#171A21',
          hover: '#1F242D',
          border: '#2A303B',
          accent: '#4F8CFF',
          accentHover: '#3b74e6',
          success: '#3FB950',
          warning: '#D29922',
          error: '#F85149',
          text: '#E6EAF0',
          subtext: '#8B94A3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      aspectRatio: {
        'cover': '2 / 3',
        'banner': '16 / 9',
      }
    },
  },
  plugins: [],
}

