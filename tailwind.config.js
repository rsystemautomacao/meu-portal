/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--team-primary, #1a365d)',
          50: 'var(--team-primary-50, #f0f4f9)',
          100: 'var(--team-primary-100, #dce5f1)',
          200: 'var(--team-primary-200, #bccee4)',
          300: 'var(--team-primary-300, #92afd1)',
          400: 'var(--team-primary-400, #6589bc)',
          500: 'var(--team-primary-500, #476ba3)',
          600: 'var(--team-primary-600, #1a365d)',
          700: 'var(--team-primary-700, #162d4d)',
          800: 'var(--team-primary-800, #12243e)',
          900: 'var(--team-primary-900, #0e1b2f)',
        },
        secondary: {
          DEFAULT: 'var(--team-secondary, #2b6cb0)',
          50: 'var(--team-secondary-50, #f2f7fc)',
          100: 'var(--team-secondary-100, #e2edf7)',
          200: 'var(--team-secondary-200, #bdd5ed)',
          300: 'var(--team-secondary-300, #8eb6df)',
          400: 'var(--team-secondary-400, #5590cd)',
          500: 'var(--team-secondary-500, #2b6cb0)',
          600: 'var(--team-secondary-600, #245a94)',
          700: 'var(--team-secondary-700, #1d4978)',
          800: 'var(--team-secondary-800, #17395c)',
          900: 'var(--team-secondary-900, #112940)',
        },
        accent: {
          DEFAULT: '#4299e1',
          50: '#f3f9fe',
          100: '#e6f2fc',
          200: '#c3e1f8',
          300: '#90c8f2',
          400: '#4299e1',
          500: '#2b7bc9',
          600: '#2262a8',
          700: '#1c4d86',
          800: '#163c69',
          900: '#112c4d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
} 