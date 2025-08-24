import { defineConfig } from "vite";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
  optimizeDeps: {
    exclude: ["@app-wasm/app-wasm"],
  },
  build: {
    target: "esnext",
    outDir: "dist",
  },
  assetsInclude: ["**/*.wasm"],
});
