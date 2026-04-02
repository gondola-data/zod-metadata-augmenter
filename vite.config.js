import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "index.cli": resolve(__dirname, "src/index.cli.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "zod",
        "fs",
        "path",
        "child_process",
        "process",
        "os",
        "crypto",
        "stream",
        "util",
        "buffer",
      ],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
