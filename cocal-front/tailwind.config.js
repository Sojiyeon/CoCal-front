/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}', // src/app/ 경로
        './pages/**/*.{js,ts,jsx,tsx,mdx}', // src/pages/ 경로 (App Router에서는 선택 사항)
        './components/**/*.{js,ts,jsx,tsx,mdx}', // src/components/ 경로
        './src/**/*.{js,ts,jsx,tsx,mdx}', // src/ 디렉토리 전체
        ],
    theme: {
        extend: {
            colors: {
                'primary': {
                    DEFAULT: '#3b82f6', // blue-500
                    dark: '#60a5fa',   // blue-400 for dark mode
                },
                'success': '#10b981', // emerald-500
                'warning': '#f59e0b', // amber-500
                'danger': '#ef4444',  // red-500

                'dark-bg': '#121212',
                'dark-surface': '#1e1e1e',
                'dark-text-primary': '#ffffff',
                'dark-text-secondary': '#b0b0b0',

                'light-bg': '#f8f8f8',
                'light-surface': '#ffffff',
                'light-text-primary': '#1f2937',
                'light-text-secondary': '#6b7280',
            }
        },
    },
    plugins: [],
}