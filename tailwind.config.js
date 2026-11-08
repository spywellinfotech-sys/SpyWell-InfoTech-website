/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#fff1f4',
          100: '#ffe0e7',
          200: '#f7c3cf',
          300: '#d99aaa',
          400: '#a8677b',
          500: '#7a3f55',
          600: '#55283b',
          700: '#3a1a29',
          800: '#26101c',
          900: '#180a12',
          950: '#0e060b',
        },
        electric: {
          300: '#ff8a96',
          400: '#f5505f',
          500: '#e4172b',
          600: '#c10f21',
        },
        brand: { teal: '#2ac4d0' },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Noto Sans Devanagari', 'Inter', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .7s ease-out both',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
