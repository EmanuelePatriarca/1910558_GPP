/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'inner-heavy': 'inset 2px 5px 10px 0 rgba(0, 0, 0, 1)',
      }
    },
  },
  plugins: [],
}
