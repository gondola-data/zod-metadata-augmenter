/**
 * Zod Schema Augmenter - Node/Full Entry Point
 *
 * This entry exposes the full library API, including augmentation and sources.
 * Browser consumers should use "./browser" for traversal-only imports.
 *
 * For CLI usage, use the "./cli" entry point.
 *
 * ## Usage
 *
 * ```typescript
 * import { augmentSchema, createTraversalObject } from "@gondola-data/zod-schema-augmenter";
 * ```
 */

// Traversal utilities (browser-safe)
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

// Augmentation functions (Node/full)
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

export type { PackageJsonInfo, GitConfigInfo } from "./sources";
