/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tibia: {
          dark: '#0a0a14',
          deeper: '#0f0f1a',
          card: '#1a1a2e',
          'card-hover': '#222240',
          border: '#2a2a45',
          gold: '#f5a623',
          'gold-light': '#ffd700',
          green: '#00d4aa',
          'green-dark': '#00a88a',
          red: '#ff4757',
          'red-dark': '#e03e4e',
          blue: '#4a9eff',
          purple: '#8b5cf6',
          mana: '#5b8dd9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glow-gold': 'radial-gradient(ellipse at center, rgba(245,166,35,0.15) 0%, transparent 70%)',
        'glow-green': 'radial-gradient(ellipse at center, rgba(0,212,170,0.1) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(245,166,35,0.3)',
        'glow-green': '0 0 20px rgba(0,212,170,0.2)',
        'glow-red': '0 0 20px rgba(255,71,87,0.2)',
        'card': '0 4px 30px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
