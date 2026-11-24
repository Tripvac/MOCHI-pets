import { defineConfig } from "vite";
export default defineConfig({
  build: {
    target: "safari16",
    cssTarget: "safari16",
    chunkSizeWarningLimit: 750,
  },
  server: { host: "0.0.0.0" },
});
