/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { validateApiOrigin } from "./src/services/apiUrl";

// FAIL-CLOSED (Gate 04A1/04A2): MỌI optimized build (command === "build") PHẢI có
// VITE_API_URL hợp lệ, không chỉ mode "production" (đóng Gap A: `--mode staging`).
// localhost chỉ được phép ở mode development/test (Gap B: dùng URL-semantics authority).
// KHÔNG hardcode hostname Render production ở đây.
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, ".", "");
    const allowLocalhost = mode === "development" || mode === "test";
    const result = validateApiOrigin(env.VITE_API_URL, { allowLocalhost });
    if (!result.ok) {
      throw new Error(
        `[vite] VITE_API_URL không hợp lệ cho build (mode=${mode}): ${result.error} ` +
          "Đặt origin HTTPS đúng trong Vercel/CI env."
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
    optimizeDeps: {
      include: ["react-is"],
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.js"],
      include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      css: false,
    },
  };
});
