import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts.
      server: { entry: "server" },
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
      },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
