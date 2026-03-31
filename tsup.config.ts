import { defineConfig } from "tsup";

export default [
  {
    entry: {
      index: "src/index.ts",
    },
    format: "esm",
    platform: "browser",
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
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
    noExternal: [],
    treeshake: true,
    minify: false,
  },
  {
    entry: {
      "index.cli": "src/index.cli.ts",
      cli: "src/cli.ts",
    },
    format: "esm",
    platform: "node",
    dts: true,
    sourcemap: true,
    clean: false,
    external: [
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
    noExternal: ["find-package-json"],
    treeshake: true,
    minify: false,
    outDir: "dist",
  },
];