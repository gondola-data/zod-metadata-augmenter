/**
 * Zod Schema Augmenter - CLI Entry Point
 *
 * This is the full-featured entry point for CLI/Node.js usage.
 * It includes source detection from git config and package.json.
 *
 * For browser usage with traversal only, use the default entry point instead.
 *
 * ## Usage
 *
 * ```typescript
 * // For CLI/Node.js runtime
 * import { augmentSchema, createTraversalObject } from "@gondola-data/zod-schema-augmenter/cli";
 * ```
 *
 * Or use the CLI directly:
 * ```bash
 * npx zod-augmenter build --input schema.ts --output dist/schema.json
 * ```
 */

// Re-export browser-safe traversal + types
export * from "./traversal";

export type {
  SchemaMetadata,
  FieldMetadata,
  SourceInfo,
  UnionMemberInfo,
  TraversalNode,
  TraversalOptions,
  TraversalPosition,
} from "./traversal";

// Augmentation (includes source detection)
export { augmentSchema, getSourceInfo } from "./augment";

// Sources (Node.js dependent)
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
