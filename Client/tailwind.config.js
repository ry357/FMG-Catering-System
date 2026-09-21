/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FCFAF3',
          100: '#F7F1E2',
          200: '#EFE1C2',
          300: '#E3CA9F',
          400: '#D4B173',
          500: '#BE9543',
          600: '#9E7526',
          700: '#7A5816',
          800: '#553C0C',
          900: '#332506',
        },
        charcoal: {
          DEFAULT: '#241B12',
          light: '#3B2F22',
          muted: '#64584A',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        elevated: '0 8px 40px rgba(190, 149, 67, 0.14)',
      },
    },
  },
  plugins: [],
};
