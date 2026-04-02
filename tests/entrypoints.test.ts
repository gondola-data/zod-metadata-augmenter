import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("entrypoint configuration", () => {
  it("maps browser exports to dist/index.browser.js", () => {
    const packageJsonPath = resolve(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    expect(packageJson.exports?.["."]?.browser).toBe("./dist/index.browser.js");
    expect(packageJson.exports?.["./browser"]?.import).toBe("./dist/index.browser.js");
  });

  it("keeps browser entry source isolated from node-only source modules", () => {
    const browserSource = readFileSync(resolve(process.cwd(), "src/index.browser.ts"), "utf8");

    expect(browserSource.includes("./sources")).toBe(false);
    expect(browserSource.includes("./augment")).toBe(false);
  });
});
