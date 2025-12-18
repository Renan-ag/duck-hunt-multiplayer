import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    allowedHosts: ["their-specially-listed-consumption.trycloudflare.com"],
  },
});
