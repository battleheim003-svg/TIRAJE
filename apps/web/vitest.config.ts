import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: [],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "../../packages/integrations/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tirajeh/database": path.resolve(__dirname, "../../packages/database/src"),
      "@tirajeh/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@tirajeh/auth": path.resolve(__dirname, "../../packages/auth/src"),
      "@tirajeh/integrations": path.resolve(__dirname, "../../packages/integrations/src"),
    },
  },
})
