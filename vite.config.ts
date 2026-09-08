import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: 3102,
      proxy: {
        "/admin-api": {
          target: env.ADMIN_API_TARGET || "http://127.0.0.1:10009",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/admin-api/, ""),
        },
        "/chat-api": {
          target: env.CHAT_API_TARGET || "http://127.0.0.1:10008",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/chat-api/, ""),
        },
        "/im-api": {
          target: env.IM_API_TARGET || "http://127.0.0.1:10002",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/im-api/, ""),
        },
      },
    },
  };
});
