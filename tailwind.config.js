/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef4ff',
          100: '#dbe7fb',
          200: '#b9cff3',
          300: '#8aaee6',
          400: '#5b86cf',
          500: '#2f5fb0',
          600: '#1e4a94',
          700: '#153a78',
          800: '#0f2c5e',
          900: '#0a2048',
          950: '#06142f',
        },
        electric: {
          300: '#ffb066',
          400: '#ff8a2b',
          500: '#e85d04',
          600: '#c44900',
        },
        brand: { teal: '#1f8fe0' },
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Baloo 2', 'Noto Sans Devanagari', 'Poppins', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ring: {
          '0%': { transform: 'scale(.62)', opacity: '.55' },
          '100%': { transform: 'scale(1.18)', opacity: '0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp .7s ease-out both',
        floaty: 'floaty 6s ease-in-out infinite',
        ring: 'ring 4.5s ease-out infinite',
      },
    },
  },
  plugins: [],
};
