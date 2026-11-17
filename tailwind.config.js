/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: { DEFAULT: '#2148D8', 600: '#1A3BB5', 700: '#142C8A' },
        soft: '#EAF0FF',
        mist: '#F5F8FF',
        navy: '#101936',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px -12px rgba(33,72,216,.18)',
        pop: '0 24px 60px -24px rgba(16,25,54,.4)',
      },
    },
  },
  plugins: [],
}
