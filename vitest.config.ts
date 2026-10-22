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
      // src/lib/email.tsx reads these at module-load time too. Not a real
      // key -- the Resend client itself is mocked in email.test.ts, so this
      // only needs to exist, never actually authenticate.
      RESEND_API_KEY: "test-only-resend-api-key-not-used-anywhere-real",
      RESEND_FROM_EMAIL: "Mini Linear <test@example.com>",
    },
  },
});
