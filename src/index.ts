/**
 * Zod Schema Augmenter
 *
 * A utility for automatically augmenting Zod schemas with SKOS-inspired metadata.
 *
 * ## Features
 *
 * - **Automatic URI generation** - Derives URIs from schema names/field names
 * - **Hierarchical relationships** - Infers `broader` (parent) and `narrower` (children)
 * - **Sequential navigation** - Provides `previous`/`next` for sibling ordering
 * - **Source metadata** - Pulls `creator` and `publisher` from git/package.json
 * - **Preserves user data** - Keeps user-defined attributes like `rank`
 *
 * ## Usage
 *
 * The `augment` function takes a schema and a Zod registry:
 *
 * ```typescript
 * import { augment } from "@json-form/zod-schema-augmenter"
 * import { z } from "zod"
 *
 * // Create a registry to track schema metadata
 * const MyRegistry = z.registry<{ registry: string; concept: string }>()
 *
 * // Add your schema with metadata
 * const UserSchema = z.object({
 *   name: z.string().meta({ rank: 0 }),
 *   email: z.string().email().meta({ rank: 1 }),
 * }).meta({ rank: 1 })
 *
 * // Register the schema
 * MyRegistry.add(UserSchema, {
 *   registry: "taxonomy",
 *   concept: "user",
 * })
 *
 * // Augment with automatic metadata
 * const augmented = augment(UserSchema, MyRegistry)
 *
 * // Access metadata via Zod's .meta() method
 * const meta = augmented.meta()
 * console.log(meta.uri)
 * // => "#/taxonomy/user/item/user" (or similar based on depth)
 * ```
 *
 * ## How It Works
 *
 * The augmentation uses a two-pass approach to handle Zod's immutability:
 *
 * 1. **Pass 1**: Traverse the schema tree and collect all metadata into a cache
 * 2. **Pass 2**: Rebuild the schema tree, applying metadata from the cache
 *
 * This ensures metadata persists correctly through the recursive traversal.
 *
 * ## Metadata Fields
 *
 * - `uri`: Unique identifier in the taxonomy hierarchy
 * - `broader`: Parent concept URI (null for root schemas)
 * - `narrower`: Array of child concept URIs
 * - `previous`/`next`: Sibling URIs for sequential navigation
 * - `created`: ISO 8601 date string
 * - `creator`: Author(s) from git config or package.json
 * - `publisher`: Publisher from package.json
 * - `rank`: User-defined ordinal for sorting (preserved if provided)
 */

export { augmentSchema, getSourceInfo } from "./augment";

export type {
  SchemaMetadata,
  FieldMetadata,
  SourceInfo,
  UnionMemberInfo,
} from "./types";

// Re-export sources for direct access
export {
  getPackageJsonInfo,
  extractAuthors,
  extractPublishers,
  getGitConfigInfo,
  extractGitAuthors,
  getCreators,
  getPublishers,
} from "./sources";

export type { PackageJsonInfo, GitConfigInfo } from "./sources";
