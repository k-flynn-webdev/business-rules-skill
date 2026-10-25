import { defineConfig } from "vitest/config";

// The examples have their own tests and run them from their own folders.
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], testTimeout: 20_000 },
});
