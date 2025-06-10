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
    extend: {},
  },
  plugins: [require("daisyui",'@tailwindcss/forms')],  // enable DaisyUI plugin
};
