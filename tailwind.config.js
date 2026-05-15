/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './App.tsx',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Emergency System
        emergency: {
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF6B6B',
          500: '#FA5252',
          600: '#F03E3E',
          700: '#E03131',
          800: '#C92A2A',
          900: '#A51111',
        },
        // Tracking Blue
        tracking: {
          50: '#E7F5FF',
          100: '#D0EBFF',
          200: '#A5D8FF',
          300: '#74C0FC',
          400: '#4DABF7',
          500: '#339AF0',
          600: '#228BE6',
          700: '#1C7ED6',
          800: '#1971C2',
          900: '#1864AB',
        },
        // Safe Green
        safe: {
          50: '#EBFBEE',
          100: '#D3F9D8',
          200: '#B2F2BB',
          300: '#8CE99A',
          400: '#69DB7C',
          500: '#51CF66',
          600: '#40C057',
          700: '#37B24D',
          800: '#2F9E44',
          900: '#2B8A3E',
        },
        // Warning Yellow
        warning: {
          50: '#FFF9DB',
          100: '#FFF3BF',
          200: '#FFEC99',
          300: '#FFE066',
          400: '#FFD43B',
          500: '#FCC419',
          600: '#FAB005',
          700: '#F59F00',
          800: '#F08C00',
          900: '#E67700',
        },
        // Dark mode neutrals
        dark: {
          50: '#C1C2C5',
          100: '#A6A7AB',
          200: '#909296',
          300: '#5C5F66',
          400: '#373A40',
          500: '#2C2E33',
          600: '#25262B',
          700: '#1A1B1E',
          800: '#141517',
          900: '#101113',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        mono: ['JetBrainsMono', 'Courier'],
      },
    },
  },
  plugins: [],
};
