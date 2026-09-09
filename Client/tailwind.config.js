/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF7ED',
          100: '#F5EBD4',
          200: '#E8D4A8',
          300: '#D4B872',
          400: '#C9A227',
          500: '#B8921F',
          600: '#9A7819',
          700: '#7A5F14',
          800: '#5C4710',
          900: '#3D2F0B',
        },
        charcoal: {
          DEFAULT: '#1C1C1C',
          light: '#3D3D3D',
          muted: '#6B6B6B',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        elevated: '0 8px 40px rgba(201, 162, 39, 0.12)',
      },
    },
  },
  plugins: [],
};
