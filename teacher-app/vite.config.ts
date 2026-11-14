import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deployed under https://<user>.github.io/main/ — use a relative base so it
// also works when opened from any sub-path (e.g. a branch preview).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
});
