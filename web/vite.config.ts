import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  resolve: {
    alias: {
      "@wasm": resolve(__dirname, "src/pkg/app_wasm"),
    },
  },
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
  base: "/app-rest/",
  assetsInclude: ["**/*.wasm"],
});
