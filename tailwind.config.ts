import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Storefront tokens
        bg: {
          base: "var(--bg-base)",
          subtle: "var(--bg-subtle)",
        },
        ink: {
          900: "var(--ink-900)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          300: "var(--ink-300)",
        },
        line: {
          100: "var(--line-100)",
          200: "var(--line-200)",
        },
        accent: {
          red: "var(--accent-red)",
          "red-soft": "var(--accent-red-soft)",
          gold: "var(--accent-gold)",
          "gold-soft": "var(--accent-gold-soft)",
        },
        df: {
          success: "var(--success)",
          "success-soft": "var(--success-soft)",
          warning: "var(--warning)",
          "warning-soft": "var(--warning-soft)",
          scrim: "var(--overlay-scrim)",
        },
        // Admin tokens
        admin: {
          bg: "var(--admin-bg)",
          elevated: "var(--admin-bg-elevated)",
          canvas: "var(--admin-bg-canvas)",
          border: "var(--admin-border)",
          "text-primary": "var(--admin-text-primary)",
          "text-secondary": "var(--admin-text-secondary)",
          accent: "var(--admin-accent)",
          "accent-hover": "var(--admin-accent-hover)",
          "accent-soft": "var(--admin-accent-soft)",
          success: "var(--admin-success)",
          warning: "var(--admin-warning)",
          danger: "var(--admin-danger)",
          info: "var(--admin-info)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["var(--font-heading)", "Neue Montreal", "Helvetica Neue", "Arial", "sans-serif"],
      },
      aspectRatio: {
        '3/4': '3 / 4',
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1.0)' },
          '100%': { transform: 'scale(1.06)' },
        },
        pulseCheck: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1.0)', opacity: '1' },
        },
      },
      animation: {
        kenburns: 'kenburns 5s ease-out forwards',
        pulseCheck: 'pulseCheck 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
