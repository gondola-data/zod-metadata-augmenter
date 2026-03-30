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
 * - **Schema traversal** - Navigate augmented schemas via metadata relationships
 *
 * ## Usage
 *
 * The `augmentSchema` function takes a schema and a Zod registry:
 *
 * ```typescript
 * import { augmentSchema, createTraversalObject } from "@gondola/zod-schema-augmenter"
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
 * const augmented = augmentSchema(UserSchema, MyRegistry)
 *
 * // Access metadata via Zod's .meta() method
 * const meta = augmented.meta()
 * console.log(meta.uri)
 * // => "#/taxonomy/concept/user"
 *
 * // Create a traversal object for navigation
 * const traversal = createTraversalObject(augmented)
 * console.log(traversal.narrower[0].meta.uri) // First child
 * console.log(traversal.byUri("#/taxonomy/concept/user/resource/name")?.meta.rank)
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

// Core augmentation
export { augmentSchema, getSourceInfo } from "./augment";

// Traversal utilities
export {
  createTraversalObject,
  findByUri,
  getNodesAtDepth,
  getPathToNode,
  traverseAll,
  getSiblings,
  getNodeDepth,
  countNodes,
} from "./traversal";

export type {
  SchemaMetadata,
  FieldMetadata,
  SourceInfo,
  UnionMemberInfo,
} from "./types";

export type {
  TraversalNode,
  TraversalOptions,
  TraversalPosition,
} from "./traversal";

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
