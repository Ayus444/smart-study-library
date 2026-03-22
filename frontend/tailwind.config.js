/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc170',
          400: '#ff9d37',
          500: '#ff7d0f',
          600: '#f05f05',
          700: '#c74608',
          800: '#9e380e',
          900: '#7f300f',
        },
        ink: {
          50: '#f6f5f0',
          100: '#e8e6dc',
          200: '#d4d0c0',
          300: '#b8b29a',
          400: '#9a9275',
          500: '#847b61',
          600: '#6d6450',
          700: '#584f41',
          800: '#2c2820',
          900: '#1a1610',
          950: '#0e0c08',
        }
      },
      backgroundImage: {
        'paper': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23faf9f6'/%3E%3Crect width='1' height='1' x='0' y='0' fill='%23f0ece0' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      }
    },
  },
  plugins: [],
}
