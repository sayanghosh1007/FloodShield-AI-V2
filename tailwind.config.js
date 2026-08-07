/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // FloodShield brand palette — government-grade blue
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec5ff',
          400: '#59a4ff',
          500: '#3380fc',
          600: '#1d61f2',
          700: '#164be0',
          800: '#183db6',
          900: '#19388f',
          950: '#142457',
        },
        accent: {
          50: '#ecfeff',
          100: '#cff9fe',
          200: '#a5f0fc',
          300: '#67e3f9',
          400: '#22ccee',
          500: '#06b6d4',
          600: '#0894b3',
          700: '#0e7591',
          800: '#155e75',
          900: '#164e63',
          950: '#083447',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a6f4d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
  900: '#7f1d1d',
        },
        // Neutral ramp with a cool tint for the GIS feel
        ink: {
          50: '#f5f8fc',
          100: '#eaf1f8',
          200: '#d6e3f0',
          300: '#b6c9de',
          400: '#8aa3c2',
          500: '#6480a3',
          600: '#4d6688',
          700: '#3f5270',
          800: '#37455e',
          900: '#2f3a4f',
          950: '#1c2333',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(28, 60, 120, 0.18)',
        'glass-sm': '0 4px 16px 0 rgba(28, 60, 120, 0.12)',
        glow: '0 0 24px 0 rgba(51, 128, 252, 0.35)',
        'glow-danger': '0 0 24px 0 rgba(239, 68, 68, 0.4)',
        'glow-warning': '0 0 24px 0 rgba(245, 158, 11, 0.4)',
        'glow-success': '0 0 24px 0 rgba(16, 185, 129, 0.35)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(rgba(28,60,120,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(28,60,120,0.06) 1px, transparent 1px)',
        'grid-dark':
          'linear-gradient(rgba(120,160,220,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,0.07) 1px, transparent 1px)',
        'topo':
          "radial-gradient(circle at 20% 20%, rgba(51,128,252,0.10), transparent 40%), radial-gradient(circle at 80% 0%, rgba(6,182,212,0.10), transparent 35%), radial-gradient(circle at 50% 100%, rgba(29,97,242,0.08), transparent 45%)",
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          '100%': { transform: 'rotate(360deg)' },
        },
        'wind-needle': {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(20deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'wave-rise': {
          '0%': { height: '20%' },
          '100%': { height: 'var(--wave-h, 60%)' },
        },
        'count-up': {
          '0%': { opacity: '0.2' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.5)' },
          '50%': { boxShadow: '0 0 0 6px rgba(6, 182, 212, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'fade-in-scale': 'fade-in-scale 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        'wind-needle': 'wind-needle 4s ease-in-out infinite',
        'wave-rise': 'wave-rise 1.2s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
