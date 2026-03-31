/**
 * Zod Schema Augmenter - Browser Entry Point
 *
 * This is the browser-safe entry point that exports ONLY traversal functionality.
 * It has no dependencies on Node.js modules (fs, path, child_process).
 *
 * For CLI usage with full features (including source detection from git/package.json),
 * use the "./cli" entry point instead.
 *
 * ## Usage
 *
 * ```typescript
 * import { createTraversalObject, type TraversalNode } from "@gondola-data/zod-schema-augmenter";
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

export type {
  SchemaMetadata,
  FieldMetadata,
  TraversalNode,
  TraversalOptions,
  TraversalPosition,
} from "./traversal";
