module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Ensure your files are included
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  variants: {
    extend: {
      display: ['group-hover'], // Enable group-hover for display utilities
    },
  },
};