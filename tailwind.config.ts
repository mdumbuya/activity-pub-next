import { type Config } from "tailwindcss";

export default {
  content: [
    "./routes/**/*.{ts,tsx}",
    "./islands/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./static/**/*.css", // If you have any custom styles in the static folder
  ],
} satisfies Config;