import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "index.cli": "src/index.cli.ts",
    cli: "src/cli.ts",
  },
  format: "esm",
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ["find-package-json"],
});