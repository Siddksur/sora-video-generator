/** @type {import('tailwindcss').Config} */
module.exports = {
    // Broaden content globs so Tailwind reliably detects all class usage in prod
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './**/*.{ts,tsx,js,jsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#eff6ff',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
          }
        }
      },
    },
    plugins: [],
  }
