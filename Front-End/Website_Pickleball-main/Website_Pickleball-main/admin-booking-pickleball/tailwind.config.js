/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        header: {
          from: '#016d39',
          to: '#07884AC5'
        }
      },
      backgroundImage: {
        login: "linear-gradient(to right bottom, #060D1633, #1A1B27E6), url('/images/dev/bg-login.png')"
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
};
