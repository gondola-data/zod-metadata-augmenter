#!/usr/bin/env node

import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const rootExport = packageJson.exports?.["."];
assert(rootExport, 'Missing exports["."]');
assert(
  rootExport.browser === "./dist/index.browser.js",
  'Expected exports["."].browser to equal "./dist/index.browser.js"'
);

const browserExport = packageJson.exports?.["./browser"];
assert(browserExport, 'Missing exports["./browser"]');
assert(
  browserExport.import === "./dist/index.browser.js",
  'Expected exports["./browser"].import to equal "./dist/index.browser.js"'
);

console.log("Package exports are configured for browser-safe entrypoints.");
