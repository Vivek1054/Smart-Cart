// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",           // scan index.html
    "./src/**/*.{js,ts,jsx,tsx}"  // scan all JS/TS/JSX/TSX files inside src
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf3ee',
          100: '#fbe4d8',
          200: '#f5c4a8',
          300: '#eda072',
          400: '#e17a44',
          500: '#c1571f',
          600: '#a8481a',
          700: '#853918',
          800: '#6b2f18',
          900: '#582a17',
        },
        cream: {
          50: '#fffdf9',
          100: '#fdf8f0',
          200: '#f7ecdd',
        },
        ink: {
          800: '#2b2621',
          900: '#1c1815',
        },
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(28, 24, 21, 0.08), 0 8px 24px -8px rgba(28, 24, 21, 0.10)',
        lift: '0 12px 32px -8px rgba(28, 24, 21, 0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  darkMode: 'class',
  plugins: [require("daisyui",'@tailwindcss/forms')],  // enable DaisyUI plugin
};