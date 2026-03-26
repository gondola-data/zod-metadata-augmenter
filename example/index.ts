/**
 * Example Usage
 *
 * This file demonstrates how to read the enriched JSON Schema
 * and parse it back to a Zod schema while preserving metadata.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as z from "zod";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the JSON Schema file
const jsonSchemaPath = path.resolve(__dirname, "dist", "data-provider-schema.json");
const jsonSchema = JSON.parse(fs.readFileSync(jsonSchemaPath, "utf-8"));

// Log the first broader and narrower concepts
console.log("=== JSON Schema Metadata ===");
console.log("Broader:", jsonSchema.metadata?.broader);
console.log("Narrower[0]:", jsonSchema.metadata?.narrower?.[0]);
console.log("URI:", jsonSchema.metadata?.uri);

// Also parse back to Zod and show metadata is preserved
const zodSchema = z.fromJSONSchema(jsonSchema);
console.log("\n=== Parsed Zod Schema Metadata ===");
const meta = zodSchema.meta() as Record<string, unknown>;
console.log("Broader:", meta.broader);
console.log("Narrower[0]:", meta.narrower?.[0]);
console.log("URI:", meta.uri);