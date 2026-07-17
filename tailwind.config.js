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
          primary: '#fefcf8',
          secondary: '#f9f5ee',
          tertiary: '#f3ede3',
          elevated: '#ffffff',
          hover: '#f0ebe0',
        },
        accent: {
          primary: '#b07d56',
          secondary: '#8b6240',
          tertiary: '#d4a574',
          dim: '#9c7048',
          glow: 'rgba(176, 125, 86, 0.12)',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#4a4540',
          tertiary: '#7a7268',
          muted: '#a09888',
        },
        border: {
          primary: '#e8e0d4',
          secondary: '#d4cabb',
          accent: 'rgba(176, 125, 86, 0.3)',
        },
        success: '#2d8a56',
        warning: '#c4841d',
        error: '#c43d3d',
        info: '#3d7cc4',
        rose: {
          gold: '#b76e79',
          light: '#e8c4c8',
        },
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
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(176, 125, 86, 0.15), 0 0 20px rgba(176, 125, 86, 0.08)' },
          '100%': { boxShadow: '0 0 10px rgba(176, 125, 86, 0.25), 0 0 40px rgba(176, 125, 86, 0.12)' },
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
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
}
