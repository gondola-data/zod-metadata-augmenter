/**
 * Build Schema Entry Point
 *
 * This script runs at build-time to augment the DataProviderSchema
 * and write the resulting JSON Schema to a file.
 * 
 * Usage: 
 *   npm run build:example
 *   npx tsx example/build-schema.ts
 */

import * as z from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { augmentSchema } from "../src/index.cli";
import { DataProviderSchema } from "./schema";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Registry {
  registry: string;
  concept: string;
}

// Create Registry
const TaxonomyRegistry = z.registry<Registry>();

// Add schema to the registry
TaxonomyRegistry.add(DataProviderSchema as any, {
  registry: "taxonomy",
  concept: "data-provider",
});

// Augmented schemas with automatic metadata
const augmentedDataProviderSchema = augmentSchema(
  DataProviderSchema,
  TaxonomyRegistry,
);

// Convert to JSON Schema
// @ts-ignore - toJSONSchema is a Zod internal method
const jsonSchema = z.toJSONSchema(augmentedDataProviderSchema) as Record<string, unknown>;

// Get metadata from the top-level schema
const metadata = augmentedDataProviderSchema.meta() as Record<string, unknown>;

// Merge the JSON schema with our custom metadata
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

// Write to file
const outputPath = path.resolve(__dirname, "dist", "data-provider-schema.json");
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ JSON Schema written to: ${outputPath}`);
console.log(`   URI: ${output.metadata?.uri}`);
console.log(`   Created: ${output.metadata?.created}`);
