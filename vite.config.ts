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
    allowedHosts: ["purchased-keeping-voices-monitors.trycloudflare.com"],
  },
});
