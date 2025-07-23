/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'flow-dark': '#1e293b',
        'flow-accent': '#f59e0b',
        'node-team': '#10b981',
        'node-chat': '#f59e0b',
        'node-task': '#3b82f6',
        'node-file': '#10b981',
        'connection': '#64748b'
      },
      animation: {
        'flow-pulse': 'flow-pulse 2s ease-in-out infinite',
        'node-highlight': 'node-highlight 0.5s ease-out',
      },
      keyframes: {
        'flow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        },
        'node-highlight': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)' },
          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
        }
      }
    },
  },
  plugins: [],
}