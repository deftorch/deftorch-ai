import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.ts", 
      "tests/unit/**/*.test.tsx", 
      "tests/components/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/api/**/*.test.ts"
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
