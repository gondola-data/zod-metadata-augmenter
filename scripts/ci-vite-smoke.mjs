#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { cp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const rootDir = process.cwd();
const fixtureDir = resolve(rootDir, ".ci/fixtures/vite-smoke");
const tempDir = mkdtempSync(join(tmpdir(), "zod-augmenter-smoke-"));
const workspaceDir = join(tempDir, "vite-smoke");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

async function main() {
  try {
    if (!existsSync(fixtureDir)) {
      throw new Error(`Fixture directory missing: ${fixtureDir}`);
    }

    await cp(fixtureDir, workspaceDir, { recursive: true });

    run("npm", ["pack", "--pack-destination", tempDir], rootDir);

    const tgzFile = readdirSync(tempDir)
      .filter((file) => file.endsWith(".tgz"))
      .sort()
      .at(-1);

    if (!tgzFile) {
      throw new Error("Could not find npm pack tarball for smoke test.");
    }

    const tarballPath = join(tempDir, tgzFile);

    await writeFile(
      join(workspaceDir, ".npmrc"),
      "@gondola-data:registry=https://registry.npmjs.org/\n",
      "utf8"
    );

    run("npm", ["install"], workspaceDir);
    run("npm", ["install", tarballPath], workspaceDir);
    run("npm", ["run", "build"], workspaceDir);

    console.log("Vite smoke test passed.");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
