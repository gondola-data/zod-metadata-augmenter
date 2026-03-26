/**
 * Example Usage
 *
 * This file demonstrates how to use the zod-schema-augmenter utility
 * with the DataProvider schemas.
 */

import * as z from "zod";
import { augmentSchema } from "../src";
import { DataProviderSchema } from "./schema";

interface Registry {
  // add new fields here
  registry: string;
  concept: string;
}

// Create Registry
const TaxonomyRegistry = z.registry<Registry>();

// Add schemas to the registry
TaxonomyRegistry.add(DataProviderSchema as any, {
  registry: "taxonomy",
  concept: "data-provider",
});

// Augmented schemas with automatic metadata
const augmentedDataProviderSchema = augmentSchema(
  DataProviderSchema,
  TaxonomyRegistry,
);

// Check the augmented metadata
console.log("=== Persona Schema Metadata ===");
// @ts-ignore - Access internal metadata
console.log(
  JSON.stringify(z.toJSONSchema(augmentedDataProviderSchema) as any, null, 2),
);
