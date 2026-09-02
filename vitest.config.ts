import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: {
      // src/lib/session.ts reads this at module-load time; needs to exist
      // before any test file imports it. Not a real secret.
      SESSION_SECRET: "test-only-session-secret-not-used-anywhere-real",
    },
  },
});
