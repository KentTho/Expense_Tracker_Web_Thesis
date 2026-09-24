/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { validateBuildApiOrigin } from "./src/services/apiUrl";

// FAIL-CLOSED (Gate 04A1/04A2/04A2.1): MỌI optimized build (command === "build") PHẢI có
// VITE_API_URL origin-only HTTPS — KHÔNG phụ thuộc mode name. localhost bị cấm ở mọi build
// (kể cả --mode development/test) vì bundle build luôn chạy runtime với import.meta.env.DEV
// === false → nếu build cho qua localhost thì runtime lại reject (build-pass/runtime-fail).
// Dev SERVER (vite dev) mới cho localhost. KHÔNG hardcode hostname Render production ở đây.
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, ".", "");
    const result = validateBuildApiOrigin(env.VITE_API_URL);
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
