// Goldstein Scheduler | Phase 11 | Session 5 | Build 2 | 2026-10-25 16:40 ET | vite config: injects commit + build time for the on-screen version label
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Netlify sets COMMIT_REF at build time; locally it is absent, so show "local".
const commit = (process.env.COMMIT_REF || "local").slice(0, 7);

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
});
