#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const browserFile = resolve("dist/index.browser.js");

if (!existsSync(browserFile)) {
  console.error(`Missing browser build artifact: ${browserFile}`);
  process.exit(1);
}

const code = readFileSync(browserFile, "utf8");

const forbiddenPatterns = [
  /\bfrom\s+["']node:[^"']+["']/g,
  /\brequire\(\s*["']node:[^"']+["']\s*\)/g,
  /\bfrom\s+["']fs["']/g,
  /\bfrom\s+["']path["']/g,
  /\bfrom\s+["']child_process["']/g,
  /\brequire\(\s*["']fs["']\s*\)/g,
  /\brequire\(\s*["']path["']\s*\)/g,
  /\brequire\(\s*["']child_process["']\s*\)/g,
  /\bprocess\.(argv|cwd|env|exit)\b/g,
];

const failures = forbiddenPatterns.filter((pattern) => {
  pattern.lastIndex = 0;
  return pattern.test(code);
});

if (failures.length > 0) {
  console.error("Browser artifact includes Node-only references:");
  failures.forEach((failure) => console.error(`- ${failure.toString()}`));
  process.exit(1);
}

console.log("Browser artifact is free of Node-only references.");
