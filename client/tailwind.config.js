/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium deep-space palette
        ink: {
          950: '#070b18',
          900: '#0b1120',
          850: '#0f1729',
          800: '#131c33',
          700: '#1b2742',
          600: '#243353',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          cyan: '#22d3ee',
          violet: '#a855f7',
          emerald: '#34d399',
          amber: '#fbbf24',
          rose: '#fb7185',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(99, 102, 241, 0.45)',
        card: '0 10px 30px -12px rgba(2, 6, 23, 0.6)',
        'card-hover': '0 20px 45px -15px rgba(79, 70, 229, 0.35)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.14) 50%, rgba(34,211,238,0.12) 100%)',
        'gradient-radial': 'radial-gradient(60% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, rgba(7,11,24,0) 70%)',
        'mesh': 'radial-gradient(at 0% 0%, rgba(99,102,241,0.20) 0px, transparent 50%), radial-gradient(at 98% 2%, rgba(168,85,247,0.16) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(34,211,238,0.12) 0px, transparent 50%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-glow': { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
