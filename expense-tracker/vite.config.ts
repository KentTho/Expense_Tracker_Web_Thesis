/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// FAIL-CLOSED (Gate 04A1): production build PHẢI có VITE_API_URL hợp lệ.
// Ngăn Vercel/CI vô tình ship bundle trỏ http://localhost:8000. Ngoại lệ local
// smoke = localhost origin. KHÔNG hardcode hostname Render production ở đây.
function assertProductionApiUrl(mode, url) {
  if (mode !== "production") return;
  const value = (url || "").trim();
  const isLocal =
    value === "http://localhost:8000" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(value);
  if (!value) {
    throw new Error(
      "[vite] VITE_API_URL bắt buộc cho production build (origin-only HTTPS). " +
        "Đặt biến này trong Vercel/CI env."
    );
  }
  if (/\/(api|auth)\/?$/i.test(value)) {
    throw new Error("[vite] VITE_API_URL phải là origin-only (không kèm /api hoặc /auth).");
  }
  if (!/^https:\/\//i.test(value) && !isLocal) {
    throw new Error("[vite] VITE_API_URL production phải là HTTPS.");
  }
}

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, ".", "");
    assertProductionApiUrl(mode, env.VITE_API_URL);
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
