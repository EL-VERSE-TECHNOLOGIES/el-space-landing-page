import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      background: 'hsl(var(--color-background) / <alpha-value>)',
      foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
      card: 'hsl(var(--color-card) / <alpha-value>)',
      'card-foreground': 'hsl(var(--color-card-foreground) / <alpha-value>)',
      primary: 'hsl(var(--color-primary) / <alpha-value>)',
      'primary-foreground': 'hsl(var(--color-primary-foreground) / <alpha-value>)',
      'primary-light': '#3F3A6B',
      secondary: 'hsl(var(--color-secondary) / <alpha-value>)',
      'secondary-foreground': 'hsl(var(--color-secondary-foreground) / <alpha-value>)',
      muted: 'hsl(var(--color-muted) / <alpha-value>)',
      'muted-foreground': 'hsl(var(--color-muted-foreground) / <alpha-value>)',
      accent: 'hsl(var(--color-accent) / <alpha-value>)',
      'accent-foreground': 'hsl(var(--color-accent-foreground) / <alpha-value>)',
      cyan: '#06B6D4',
      amber: '#F59E0B',
      destructive: 'hsl(var(--color-destructive) / <alpha-value>)',
      'destructive-foreground': 'hsl(var(--color-destructive-foreground) / <alpha-value>)',
      border: 'hsl(var(--color-border) / <alpha-value>)',
      input: 'hsl(var(--color-input) / <alpha-value>)',
      ring: 'hsl(var(--color-ring) / <alpha-value>)',
      white: '#FFFFFF',
      black: '#000000',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'calc(0.5rem + 0.5rem)',
        md: 'calc(0.5rem + 0.25rem)',
        sm: 'calc(0.5rem - 0.125rem)',
      },
    },
  },
  plugins: [],
}

export default config
