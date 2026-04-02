/**
 * Zod Schema Augmenter - Browser Entry Point
 *
 * This entry intentionally exports only browser-safe traversal utilities.
 * It must never import Node.js builtins or Node-dependent source modules.
 */

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
} from "./types";

export type {
  TraversalNode,
  TraversalOptions,
  TraversalPosition,
} from "./traversal";
