/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#334155',
        secondary: '#64748B',
        accent: '#0F172A',
        background: '#F7F9FB',
        surface: '#FFFFFF',
        'surface-soft': '#F0F4F7',
        'surface-muted': '#E8EFF3',
        'sys-text': '#1F2937',
        'text-muted': '#667085',
        border: '#D0D5DD',
        error: '#B42318',
        success: '#0F766E',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
        jetbrains: ['JetBrains Mono', 'monospace'],
        noto: ['Noto Sans KR', 'sans-serif'],
        serif: ['Noto Serif KR', 'Noto Serif', 'serif'],
      },
      boxShadow: {
        soft: '0 16px 32px rgba(15, 23, 42, 0.04)',
        float: '0 20px 48px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'hero-glow': 'linear-gradient(180deg, #F7F9FB 0%, #EEF2F6 100%)',
        'primary-soft': 'linear-gradient(135deg, #334155 0%, #475569 100%)',
        'primary-strong': 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
      },
    },
  },
  plugins: [],
};
