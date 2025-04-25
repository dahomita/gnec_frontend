/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Adjust if using `pages` dir
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Crucial for App Router
      // Add any other directories where you use Tailwind classes
    ],
    theme: {
      extend: {
        // Optional: Extend the theme here
        fontFamily: { // Example if you want to use Tailwind classes for Geist
          sans: ['var(--font-geist-sans)'],
          mono: ['var(--font-geist-mono)'],
        },
      },
    },
    plugins: [],
  }