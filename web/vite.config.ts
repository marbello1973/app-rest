import { defineConfig } from "vite";
//import wasm from "vite-plugin-wasm";
//import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
  build: {
    target: "esnext",
    outDir: "dist",
  },
  base: "/app-rest/",
});
