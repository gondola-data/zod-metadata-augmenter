/**
 * Zod Schema Traversal
 *
 * A utility for navigating through augmented Zod schemas using metadata relationships.
 * Creates a traversable object that provides navigation via narrower/previous/next
 * and URI-based lookups.
 *
 * ## Usage
 *
 * ```typescript
 * import { augmentSchema, createTraversalObject } from "@gondola-data/zod-schema-augmenter/cli";
 * import * as z from "zod";
 *
 * const UserSchema = z.object({
 *   name: z.string().meta({ rank: 0 }),
 *   email: z.string().email().meta({ rank: 1 }),
 *   profile: z.object({
 *     bio: z.string().meta({ rank: 0 }),
 *     avatar: z.string().meta({ rank: 1 }),
 *   }).meta({ rank: 2 }),
 * });
 *
 * const registry = z.registry<{ registry: string; concept: string }>();
 * registry.add(UserSchema, { registry: "taxonomy", concept: "user" });
 *
 * const augmented = augmentSchema(UserSchema, registry);
 * const traversal = createTraversalObject(augmented);
 *
 * // Navigate to first child field
 * const nameField = traversal.narrower[0];
 * console.log(nameField.meta.uri);
 *
 * // Navigate to nested field
 * const profile = traversal.narrower.find(n => n.meta.uri.includes("profile"));
 * const bio = profile?.narrower[0];
 * console.log(bio?.meta.rank); // 0
 *
 * // Or use URI lookup
 * const bioViaUri = traversal.byUri("#/taxonomy/concept/user/item/profile/resource/bio");
 * ```
 */

import * as z from "zod";
import type { SchemaMetadata } from "./types";

/**
 * A node in the schema traversal tree
 *
 * Provides navigation through the augmented schema using metadata relationships.
 * Each node maintains references to its children (narrower), previous/next siblings,
 * and provides a byUri lookup for O(1) access to any node.
 */
export interface TraversalNode {
  /** The Zod schema at this node */
  schema: z.ZodTypeAny;

  /** The metadata attached to this schema */
  meta: SchemaMetadata;

  /** Child nodes (derived from narrower URIs) */
  narrower: TraversalNode[];

  /** Previous sibling node (derived from metadata.previous) */
  previous: TraversalNode | null;

  /** Next sibling node (derived from metadata.next) */
  next: TraversalNode | null;

  /**
   * Look up any node in the tree by its URI
   * Provides O(1) access to any node from any other node
   */
  byUri: (uri: string) => TraversalNode | undefined;
}

/**
 * Internal node context used during construction
 * Stores URIs that haven't been resolved to actual nodes yet
 */
interface NodeContext {
  schema: z.ZodTypeAny;
  meta: SchemaMetadata;
  narrower: string[]; // URIs of children (not yet resolved)
  previous: string | null;
  next: string | null;
}

/**
 * Options for creating a traversal object
 */
export interface TraversalOptions {
  /**
   * Whether to include the flat URI index (byUri)
   * Disable for smaller memory footprint if not needed
   * @default true
   */
  includeUriIndex?: boolean;
}

/**
 * Result from traversing to a specific position
 */
export interface TraversalPosition {
  node: TraversalNode;
  path: string[];
  depth: number;
}

/**
 * Create a traversable object from an augmented Zod schema
 *
 * This function builds a navigation structure that allows walking through
 * the schema tree using the metadata relationships (narrower, previous, next)
 * and provides O(1) URI lookups.
 *
 * @param augmentedSchema - A Zod schema that has been augmented with metadata
 *                          (via augmentSchema function)
 * @returns A TraversalNode that provides navigation through the schema tree
 * @throws Error if no root node is found in the augmented schema
 *
 * @example
 * ```typescript
 * const registry = z.registry<{ registry: string; concept: string }>();
 * registry.add(mySchema, { registry: "taxonomy", concept: "user" });
 * const augmented = augmentSchema(mySchema, registry);
 * const traversal = createTraversalObject(augmented);
 *
 * // Navigate children
 * for (const child of traversal.narrower) {
 *   console.log(child.meta.uri);
 * }
 *
 * // Find specific node
 * const node = traversal.byUri("#/taxonomy/concept/user/resource/name");
 * ```
 */
export function createTraversalObject(
  augmentedSchema: z.ZodTypeAny,
  _options?: TraversalOptions
): TraversalNode {
  // Step 1: Collect all nodes into a flat map
  const nodeMap = new Map<string, NodeContext>();
  collectNodes(augmentedSchema, nodeMap);

  // Step 2: Build the nested traversal structure with linked relationships
  const traversalNodes = linkNodes(nodeMap);

  // Step 3: Find the root
  // The root is the node whose broader is NOT found in the nodeMap
  // (i.e., it's the direct child of the registry base like #/taxonomy)
  let root: TraversalNode | undefined;
  
  // First, try to find node with broader === null (if any schema set it that way)
  for (const node of traversalNodes.values()) {
    if (node.meta.broader === null) {
      root = node;
      break;
    }
  }
  
  // If not found, find the node whose broader is not in the nodeMap
  if (!root) {
    for (const node of traversalNodes.values()) {
      const broader = node.meta.broader;
      if (broader && !traversalNodes.has(broader)) {
        root = node;
        break;
      }
    }
  }
  
  // Fallback: if still not found, just take the first node with a URI
  // (this handles edge cases where all nodes are linked)
  if (!root) {
    for (const node of traversalNodes.values()) {
      if (node.meta.uri) {
        root = node;
        break;
      }
    }
  }

  // Step 4: Add byUri helper to all nodes
  for (const node of traversalNodes.values()) {
    node.byUri = (uri: string) => traversalNodes.get(uri);
  }

  if (!root) {
    throw new Error("Could not find root node in augmented schema");
  }

  return root;
}

/**
 * First pass: Collect all nodes into a flat map
 *
 * Traverses the augmented schema and stores each node's context
 * (schema, metadata, and relationship URIs) in a Map keyed by URI.
 */
function collectNodes(
  schema: z.ZodTypeAny,
  nodeMap: Map<string, NodeContext>
): void {
  const meta = schema.meta() as SchemaMetadata | undefined;

  if (!meta?.uri) {
    // Node without metadata - traverse children but don't add to map
    if (schema.type === "object") {
      for (const [, fieldSchema] of Object.entries(schema.shape)) {
        collectNodes(fieldSchema, nodeMap);
      }
    } else if (schema.type === "union") {
      // @ts-ignore - Zod internal
      for (const option of schema._def.options) {
        collectNodes(option, nodeMap);
      }
    } else if (schema.type === "array") {
      collectNodes(schema._def.element, nodeMap);
    }
    return;
  }

  // Store this node's context (narrower URIs, not yet resolved)
  nodeMap.set(meta.uri, {
    schema,
    meta,
    narrower: meta.narrower ?? [],
    previous: meta.previous,
    next: meta.next,
  });

  // Recursively collect from children
  if (schema.type === "object") {
    for (const [, fieldSchema] of Object.entries(schema.shape)) {
      collectNodes(fieldSchema, nodeMap);
    }
  } else if (schema.type === "union") {
    // @ts-ignore - Zod internal
    for (const option of schema._def.options) {
      collectNodes(option, nodeMap);
    }
  } else if (schema.type === "array") {
    collectNodes(schema._def.element, nodeMap);
  }
}

/**
 * Second pass: Link nodes to create the traversal structure
 *
 * Converts the flat map of NodeContexts into TraversalNodes with
 * proper references to sibling and child nodes.
 */
function linkNodes(
  nodeMap: Map<string, NodeContext>
): Map<string, TraversalNode> {
  const result = new Map<string, TraversalNode>();

  // First pass: Create TraversalNodes without relationships
  for (const [uri, context] of nodeMap) {
    result.set(uri, {
      schema: context.schema,
      meta: context.meta,
      narrower: [], // Will be populated below
      previous: null,
      next: null,
      byUri: () => undefined, // Placeholder - will be set after
    });
  }

  // Second pass: Link relationships using URIs
  for (const [uri, context] of nodeMap) {
    const node = result.get(uri)!;

    // Link narrower (children)
    node.narrower = context.narrower
      .map((childUri) => result.get(childUri))
      .filter((child): child is TraversalNode => child !== undefined);

    // Link previous sibling
    if (context.previous) {
      node.previous = result.get(context.previous) ?? null;
    }

    // Link next sibling
    if (context.next) {
      node.next = result.get(context.next) ?? null;
    }
  }

  return result;
}

/**
 * Find a node by URI in the traversal tree
 *
 * @param root - The root traversal node
 * @param uri - The URI to search for
 * @returns The node with the matching URI, or undefined if not found
 */
export function findByUri(
  root: TraversalNode,
  uri: string
): TraversalNode | undefined {
  return root.byUri(uri);
}

/**
 * Get all nodes at a specific depth in the tree
 *
 * @param root - The root traversal node
 * @param targetDepth - The depth to find nodes at (0 = root)
 * @returns Array of nodes at the specified depth
 */
export function getNodesAtDepth(
  root: TraversalNode,
  targetDepth: number
): TraversalNode[] {
  const results: TraversalNode[] = [];

  function traverse(node: TraversalNode, depth: number): void {
    if (depth === targetDepth) {
      results.push(node);
      return;
    }
    for (const child of node.narrower) {
      traverse(child, depth + 1);
    }
  }

  traverse(root, 0);
  return results;
}

/**
 * Get the path from root to a specific node
 *
 * @param root - The root traversal node
 * @param targetUri - The URI of the target node
 * @returns Array of nodes from root to target, or null if not found
 */
export function getPathToNode(
  root: TraversalNode,
  targetUri: string
): TraversalNode[] | null {
  const path: TraversalNode[] = [];

  function find(node: TraversalNode): boolean {
    path.push(node);

    if (node.meta.uri === targetUri) {
      return true;
    }

    for (const child of node.narrower) {
      if (find(child)) {
        return true;
      }
    }

    path.pop();
    return false;
  }

  return find(root) ? path : null;
}

/**
 * Iterate over all nodes in the traversal tree (depth-first)
 *
 * @param root - The root traversal node
 * @yield Each node in the tree in depth-first order
 */
export function* traverseAll(
  root: TraversalNode
): Generator<TraversalNode, void, unknown> {
  const stack: TraversalNode[] = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    yield node;

    // Add children in reverse order for correct traversal
    for (let i = node.narrower.length - 1; i >= 0; i--) {
      stack.push(node.narrower[i]);
    }
  }
}

/**
 * Get all sibling nodes including the current node
 *
 * @param node - The node to get siblings for
 * @returns Array of siblings in order (previous -> current -> next)
 */
export function getSiblings(node: TraversalNode): TraversalNode[] {
  const siblings: TraversalNode[] = [];

  // Go to first sibling
  let current: TraversalNode | null = node;
  while (current?.previous) {
    current = current.previous;
  }

  // Collect all siblings forward
  while (current) {
    siblings.push(current);
    current = current.next;
  }

  return siblings;
}

/**
 * Get the depth of a node in the traversal tree
 *
 * @param root - The root traversal node
 * @param node - The node to find depth for
 * @returns The depth of the node, or -1 if not found
 */
export function getNodeDepth(root: TraversalNode, node: TraversalNode): number {
  const path = getPathToNode(root, node.meta.uri);
  return path ? path.length - 1 : -1;
}

/**
 * Count total number of nodes in the traversal tree
 *
 * @param root - The root traversal node
 * @returns Total count of all nodes
 */
export function countNodes(root: TraversalNode): number {
  let count = 0;
  for (const _ of traverseAll(root)) {
    count++;
  }
  return count;
}
