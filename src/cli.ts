#!/usr/bin/env node

/**
 * CLI for Zod Schema Augmenter
 *
 * Usage:
 *   zod-augmenter build --input <path> --output <path> --registry <name> --concept <name> [--export <name>]
 *
 * Example:
 *   zod-augmenter build --input schema.ts --output dist/schema.json --registry taxonomy --concept user
 */

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CliArgs {
  input: string;
  output: string;
  registry: string;
  concept: string;
  export: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const options: Partial<CliArgs> = {
    export: "schema",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--input":
      case "-i":
        if (!next || next.startsWith("--")) {
          throw new Error(`--input requires a value`);
        }
        options.input = next;
        i++;
        break;

      case "--output":
      case "-o":
        if (!next || next.startsWith("--")) {
          throw new Error(`--output requires a value`);
        }
        options.output = next;
        i++;
        break;

      case "--registry":
      case "-r":
        if (!next || next.startsWith("--")) {
          throw new Error(`--registry requires a value`);
        }
        options.registry = next;
        i++;
        break;

      case "--concept":
      case "-c":
        if (!next || next.startsWith("--")) {
          throw new Error(`--concept requires a value`);
        }
        options.concept = next;
        i++;
        break;

      case "--export":
      case "-e":
        if (!next || next.startsWith("--")) {
          throw new Error(`--export requires a value`);
        }
        options.export = next;
        i++;
        break;

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);

      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  if (!options.input) {
    throw new Error(`--input is required. Run --help for usage.`);
  }
  if (!options.output) {
    throw new Error(`--output is required. Run --help for usage.`);
  }
  if (!options.registry) {
    throw new Error(`--registry is required. Run --help for usage.`);
  }
  if (!options.concept) {
    throw new Error(`--concept is required. Run --help for usage.`);
  }

  return options as CliArgs;
}

function printHelp() {
  console.log(`
Zod Schema Augmenter CLI

Usage:
  zod-augmenter build --input <path> --output <path> --registry <name> --concept <name> [--export <name>]

Options:
  --input, -i     Path to the TypeScript file exporting the schema (required)
  --output, -o    Output path for the JSON Schema file (required)
  --registry      Registry name for the schema (required)
  --concept       Root concept name for the schema (required)
  --export, -e    Export name to look for in the input file (default: "schema")
  --help, -h      Show this help message

Example:
  zod-augmenter build --input schema.ts --output dist/schema.json --registry taxonomy --concept user
`);
}

function runBuild() {
  const args = parseArgs();

  // Validate input file exists
  if (!fs.existsSync(args.input)) {
    throw new Error(`Input file not found: ${args.input}`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(args.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build the inline script that does the augmentation
  const augmentPath = path.resolve(__dirname, "..", "src", "augment.ts");
  const inlineScript = `
import * as z from "zod";
import * as fs from "fs";
import * as path from "path";
import { augmentSchema } from "${augmentPath}";

interface Registry {
  registry: string;
  concept: string;
}

const inputPath = path.resolve(process.cwd(), "${args.input.replace(/\\/g, "\\\\")}");
const mod = await import(inputPath);
const schema = mod["${args.export}"];

if (!schema) {
  const available = Object.keys(mod).filter(k => !k.startsWith("_"));
  throw new Error(\`Export "${args.export}" not found. Available: \${available.join(", ")}\`);
}

const registry = z.registry<Registry>();
registry.add(schema, {
  registry: "${args.registry}",
  concept: "${args.concept}",
});

const augmentedSchema = augmentSchema(schema, registry);

// @ts-ignore - toJSONSchema is internal
const jsonSchema = z.toJSONSchema(augmentedSchema);
const metadata = augmentedSchema.meta();

const output = {
  ...jsonSchema,
  metadata: {
    uri: metadata.uri,
    broader: metadata.broader,
    narrower: metadata.narrower,
    previous: metadata.previous,
    next: metadata.next,
    created: metadata.created,
    creator: metadata.creator,
    publisher: metadata.publisher,
  },
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: metadata.uri,
};

const outputPath = path.resolve(process.cwd(), "${args.output.replace(/\\/g, "\\\\")}");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log("SUCCESS:" + outputPath);
console.log("URI:" + metadata.uri);
`;

  return new Promise<void>((resolve, reject) => {
    // Write inline script to a temp file to avoid -e issues with top-level await
    const tempFile = path.join(outputDir, `.zod-augmenter-temp-${Date.now()}.ts`);
    fs.writeFileSync(tempFile, inlineScript);

    const ps = spawn(
      "npx",
      ["tsx", tempFile],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    ps.stdout.on("data", (data) => {
      output += data.toString();
    });

    ps.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ps.on("close", (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {}

      if (code !== 0) {
        console.error("Error during build:");
        console.error(errorOutput);
        reject(new Error(`Build failed with code ${code}`));
        return;
      }

      // Parse output for success message
      const lines = output.split("\n");
      const uriLine = lines.find((l) => l.startsWith("URI:"));
      const uri = uriLine ? uriLine.replace("URI:", "") : "";

      console.log(`✅ JSON Schema written to: ${args.output}`);
      console.log(`   URI: ${uri}`);
      console.log(`   Broader: #/${args.registry}`);
      
      resolve();
    });
  });
}

runBuild().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});