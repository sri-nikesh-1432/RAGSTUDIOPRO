/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#faf7f2',
          secondary: '#f5f0e8',
          tertiary: '#ede7da',
          elevated: '#ffffff',
          hover: '#e5dcca',
        },
        accent: {
          primary: '#d4a574',
          secondary: '#c4956a',
          tertiary: '#e3c9a8',
          dim: '#b8845a',
          glow: 'rgba(212, 165, 116, 0.15)',
        },
        text: {
          primary: '#1a1816',
          secondary: '#4a4440',
          tertiary: '#7a7268',
          muted: '#9e968b',
        },
        border: {
          primary: '#e8e0d4',
          secondary: '#d9cebe',
          accent: 'rgba(212, 165, 116, 0.3)',
        },
        cream: {
          50: '#fdfcfa',
          100: '#faf7f2',
          200: '#f5f0e8',
          300: '#ede7da',
          400: '#e5dcca',
          500: '#d9cebe',
          600: '#c4b8a6',
          700: '#a09284',
          800: '#7a7268',
          900: '#4a4440',
        },
        sage: {
          light: '#e8ede0',
          DEFAULT: '#b8c9a8',
          dark: '#8aa075',
        },
        blush: {
          light: '#f5eaec',
          DEFAULT: '#e3c4c8',
          dark: '#c99ea3',
        },
        success: '#5a9e6f',
        warning: '#d4a04a',
        error: '#c46060',
        info: '#5a8fc4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'gradient': 'gradient 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 165, 116, 0.15), 0 0 20px rgba(212, 165, 116, 0.08)' },
          '100%': { boxShadow: '0 0 10px rgba(212, 165, 116, 0.25), 0 0 40px rgba(212, 165, 116, 0.12)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
}
