import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        controller: "controller.html",
      },
    },
  },
  server: {
    allowedHosts: ["wisconsin-between-budgets-plumbing.trycloudflare.com"],
  },
});
