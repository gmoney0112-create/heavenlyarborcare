import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#14532d',
          800: '#166534',
          700: '#15803d',
          600: '#16a34a',
          50:  '#f0fdf4',
        },
      },
    },
  },
  plugins: [],
}
export default config
