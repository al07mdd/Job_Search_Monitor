/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--color-bg))",
                surface: "hsl(var(--color-surface))",
                primary: "hsl(var(--color-primary))",
                secondary: "hsl(var(--color-secondary))",
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
