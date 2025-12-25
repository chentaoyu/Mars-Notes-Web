import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Load .env from root directory
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.resolve(rootDir, ".env") });

const frontendPort = parseInt(process.env.FRONTEND_PORT || "3000", 10);
const backendPort = parseInt(process.env.BACKEND_PORT || "3001", 10);

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(rootDir, "node_modules/vditor/dist/js/**/*"),
          dest: "vendor/vditor/dist/js",
        },
        {
          src: path.resolve(rootDir, "node_modules/vditor/dist/css/**/*"),
          dest: "vendor/vditor/dist/css",
        },
        {
          src: path.resolve(rootDir, "node_modules/vditor/dist/images/**/*"),
          dest: "vendor/vditor/dist/images",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@note-book/shared": path.resolve(__dirname, "../shared/src"),
    },
    preserveSymlinks: true,
  },
  server: {
    port: frontendPort,
    proxy: {
      "/api": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
