import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/helpers/setup.js"],
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: {
      concurrent: false,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: [
        "controllers/**/*.js",
        "services/**/*.js",
        "repositories/**/*.js",
        "validation/**/*.js",
        "models/**/*.js",
      ],
      exclude: ["node_modules/", "tests/"],
    },
  },
});
