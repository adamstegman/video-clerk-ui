/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type UserConfig as VitestConfig } from "vitest/node";

export default defineConfig({
  plugins: [
    tailwindcss(),
    // Only apply React Router plugin when not in test mode to avoid import.meta.env issues
    ...(process.env.VITEST ? [] : [reactRouter()]),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ['./vitest.setup.ts'],
  },
} as UserConfig & { test: VitestConfig });
