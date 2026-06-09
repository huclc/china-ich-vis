import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 3001, strictPort: false },
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
});
