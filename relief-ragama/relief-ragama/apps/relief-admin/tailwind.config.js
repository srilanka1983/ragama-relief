/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./client/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        raised: "var(--color-raised)",
        inset: "var(--color-inset)",
        border: "var(--color-border)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        error: "var(--color-error)",
        "error-weak": "var(--color-error-weak)",
      },
    },
  },
  plugins: [],
};
