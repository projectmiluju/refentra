/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        background: '#0F172A',
        surface: '#1E293B',
        'sys-text': '#F8FAFC',
        'text-muted': '#94A3B8',
        error: '#EF4444',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
        noto: ['Noto Sans KR', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
