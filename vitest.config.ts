import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/unit/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "coverage/**",
        "design/**",
        "docs/**",
        "next.config.ts",
        "src/app/layout.tsx",
        "tests/**",
      ],
    },
  },
});
