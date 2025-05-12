/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        header: {
          from: '#016d39',
          to: '#016d39'
        }
      },
      backgroundImage: {
        login: "linear-gradient(to right bottom, #0C4D0433, #1A5026E6), url('/images/dev/bg-login.png')"
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
};
