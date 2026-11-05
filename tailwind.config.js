/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef3fb',
          100: '#d6e1f3',
          200: '#aebfe0',
          300: '#7f95c4',
          400: '#4d6aa3',
          500: '#2c4a85',
          600: '#1b3668',
          700: '#122851',
          800: '#0c1d3e',
          900: '#081330',
          950: '#050c20',
        },
        electric: {
          300: '#7fc6ff',
          400: '#3fa9ff',
          500: '#0a8bff',
          600: '#0070e0',
        },
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
