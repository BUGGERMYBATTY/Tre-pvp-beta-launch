/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Orbitron"', 'sans-serif'],
      },
      colors: {
        'brand-dark': '#0A0B1A',
        'brand-gray': '#1A1B2E',
        'brand-light': '#F0F2F5',
        'blue': {
          'light': '#7DF9FF',
          'DEFAULT': '#00BFFF',
          'dark': '#008C9E',
        },
        'pink': {
          'light': '#FF7ED4',
          'DEFAULT': '#FF1493',
          'dark': '#C2007B',
        },
        'yellow': {
          'light': '#FFF700',
          'DEFAULT': '#FFD700',
          'dark': '#E0B400',
        },
        'violet': {
          'light': '#C792EA',
          'DEFAULT': '#9B59B6',
          'dark': '#6A1B9A',
        },
         'green': {
          'light': '#50E3C2',
          'DEFAULT': '#2ECC71',
          'dark': '#1E8449',
        },
      },
      backgroundImage: {
        'glassmorphism': 'linear-gradient(135deg, rgba(26, 27, 46, 0.6), rgba(26, 27, 46, 0.3))',
      },
      boxShadow: {
        'glow-blue': '0 0 15px 5px rgba(0, 191, 255, 0.4)',
        'glow-yellow': '0 0 15px 5px rgba(255, 215, 0, 0.4)',
        'glow-pink': '0 0 15px 5px rgba(255, 20, 147, 0.4)',
        'glow-violet': '0 0 15px 5px rgba(155, 89, 182, 0.4)',
      },
      keyframes: {
        starfield: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(-2000px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 5px var(--glow-color)' },
          '50%': { boxShadow: '0 0 30px 15px var(--glow-color)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(0, 191, 255, 0.5)' },
          '50%': { borderColor: 'rgba(0, 191, 255, 1)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        lineClear: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.5', backgroundColor: '#ffffff' },
        }
      },
      animation: {
        starfield: 'starfield 120s linear infinite',
        pulseGlow: 'pulseGlow 2.5s ease-in-out infinite',
        borderGlow: 'borderGlow 2s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        lineClear: 'lineClear 0.3s ease-out forwards',
      }
    }
  },
  plugins: [],
}
