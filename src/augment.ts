/**
 * Zod Schema Augmenter
 *
 * Recursively augments Zod schemas with SKOS-inspired metadata,
 * automatically populating attributes from industry-standard sources
 * (package.json, git config) while preserving user-defined attributes (like rank).
 *
 * ## Two-Pass Approach
 *
 * Zod schemas are immutable - calling `.meta()` returns a NEW schema instance
 * rather than modifying in place. This means a naive recursive approach fails
 * because child schemas are augmented but never captured.
 *
 * Solution: Use a two-pass approach:
 * 1. **Pass 1 (collectMetadata)**: Traverse the entire schema tree and store
 *    all computed metadata in a cache (Map). Don't apply metadata yet.
 * 2. **Pass 2 (buildAugmentedSchema)**: Rebuild the schema tree from scratch,
 *    applying metadata from the cache at each step.
 *
 * ## URI Construction with Field Names
 *
 * Field names must be known BEFORE recursing into child schemas. If we generate
 * URIs inside the recursion, the parent doesn't know its children's names.
 *
 * Solution: Pass the child name via the `_uri` parameter:
 * - `collectMetadata(child, registry, sourceInfo, uri, childUri)` - pass pre-computed URI
 * - In the child, use `_uri ?? generateUri(...)` to use provided URI
 *
 * ## Zod Internal Access
 *
 * This module accesses Zod internals via `schema._def` and `schema.type`.
 * These are not part of Zod's public API and may change between versions.
 *
 * Key internal structures:
 * - `schema._def.shape` - object field definitions
 * - `schema._def.options` - union option schemas
 * - `schema._def.discriminator` - discriminated union key
 * - `schema._def.element` - array element type
 * - `schema._def.values` - enum/literal values
 *
 * ## Discriminated Union Handling
 *
 * For discriminated unions, we extract the discriminator value (e.g., "database", "api")
 * from `option.shape[discriminatorKey]._def.values[0]` to use as the child name,
 * rather than relying on constructor names.
 *
 * ## Array Handling
 *
 * Both passes handle arrays by traversing into `schema._def.element`. The array
 * itself doesn't get metadata - its element type becomes the child.
 */

import * as z from "zod";
import type { SourceInfo } from "./types";
import { getSourceInfo, getCreators, getPublishers } from "./sources";

const now = new Date();

/**
 * Convert a schema name to a URL-friendly slug
 * Example: "DataProviderAuthenticationDatabase" -> "authentication/database"
 */
function deriveSlug(name: string): string {
  // PascalCase to kebab-case
  return name.replace(/\s+/g, "-").toLowerCase();
}

/**
 * Generate URI for a schema based on its name and parent
 *
 * URI format follows SKOS taxonomy conventions:
 * - resource: top-level schema -> #/.../resource/{slug}
 * - item: one level deep -> #/.../item/{slug}
 * - concept: more than one level deep -> #/.../concept/{slug} or #/.../{slug}
 *
 * @param broaderUri - Parent URI in the hierarchy
 * @param schema - The Zod schema (used to determine node type)
 * @param name - Name to derive slug from (null if using pre-computed _uri)
 */
function generateUri(
  broaderUri: string,
  schema: z.zodTypeAny,
  name: string | null,
): string {
  if (!name) return broaderUri;

  const slug = deriveSlug(name);
  const node_type = _nodeType(schema);

  switch (node_type) {
    case "resource":
      return `${broaderUri}/resource/${slug}`;
    case "item":
      return `${broaderUri}/item/${slug}`;
    case "concept":
      return broaderUri?.includes("concept")
        ? `${broaderUri}/${slug}`
        : `${broaderUri}/concept/${slug}`;
    default:
      return `${broaderUri}/${slug}`;
  }
}

/**
 * Get the name of a schema from various sources
 *
 * @param schema - The Zod schema
 * @returns The schema name or null if not found
 */
function getSchemaName(schema: z.ZodTypeAny): string | null {
  // Try to get from _def
  try {
    // @ts-ignore - Zod internal
    const def = schema._def;
    if (def && typeof def === "object") {
      // @ts-ignore
      if (def.shape) return def.shape?._name?.value || null;
    }
  } catch {
    // Ignore
  }

  // Try constructor name
  const constructorName = schema.constructor?.name;
  if (constructorName && constructorName !== "Zod schema") {
    return constructorName;
  }

  return null;
}

/**
 * Determine the node type based on nesting depth
 *
 * Traverses a Zod schema to find how far the current node is from the end
 * of nested objects/unions. Used for SKOS-inspired URI generation:
 * - "resource": top-level schema (count === 0)
 * - "item": one level deep (count === 1)
 * - "concept": more than one level deep (count > 1)
 *
 * @param schema - The Zod schema to analyze
 * @param count - Current nesting depth (internal use)
 * @returns The node type string
 */
function _nodeType(schema: z.ZodTypeAny, count: number = 0): string {
  const schemaType = schema.type;

  // Base case: primitive/leaf types (string, number, boolean, enum, etc.)
  if (!["object", "union", "array"].includes(schemaType)) {
    if (count > 1) return "concept";
    if (count === 1) return "item";
    return "resource";
  }

  // Handle arrays - traverse into the element type
  if (schemaType === "array") {
    return _nodeType(schema._def.element, count + 1);
  }

  // Handle objects - traverse into first field
  if (schemaType === "object") {
    const shape = schema._def.shape;
    const keys = Object.keys(shape);
    if (keys.length > 0) {
      return _nodeType(shape[keys[0]], count + 1);
    }
    // Empty object - treat as leaf
    if (count > 1) return "concept";
    if (count === 1) return "item";
    return "resource";
  }

  // Handle unions (including discriminatedUnion) - traverse first option
  if (schemaType === "union") {
    const options = schema._def.options;
    if (options && options.length > 0) {
      return _nodeType(options[0], count + 1);
    }
  }

  // Fallback for any unexpected case
  if (count > 1) return "concept";
  if (count === 1) return "item";
  return "resource";
}

/**
 * Cache for storing calculated metadata during collection phase
 */
const metadataCache = new Map<z.ZodTypeAny, Record<string, unknown>>();

/**
 * Pass 1: Collect all metadata into cache
 *
 * Traverses the schema tree and calculates metadata for each schema.
 * Metadata is stored in a cache (Map) rather than applied immediately.
 * This is required because Zod's `.meta()` returns a new schema instance.
 *
 * @param schema - The Zod schema to collect metadata for
 * @param registry - Registry containing schema metadata
 * @param sourceInfo - Source information (git, package.json)
 * @param broaderUri - Parent URI in the hierarchy
 * @param _uri - Optional override URI. When provided, this exact URI is used
 *               instead of generating one from the schema name. This is critical
 *               for object fields where we need the field name in the URI but
 *               cannot know it until we're inside the parent's iteration.
 * @param _previousUri - Optional override for the previous URI
 * @param _nextUri - Optional override for the next URI
 */
function collectMetadata(
  schema: z.ZodTypeAny,
  registry: z.ZodTypeAny,
  sourceInfo: SourceInfo,
  broaderUri: string | null,
  _uri: string | null = null,
  _previousUri: string | null = null,
  _nextUri: string | null = null,
): void {
  // Use provided _uri or generate from schema name
  const name = getSchemaName(schema) || registry.get(schema)?.concept;
  const uri =
    _uri ??
    generateUri(
      broaderUri || `#/${registry.get(schema).registry}`,
      schema,
      name,
    );

  // Get children based on schema type - include key, schema, and rank
  let children: { key: string; schema: z.ZodTypeAny; rank: number }[] = [];
  if (schema.type === "object") {
    const ranked = Object.entries(schema.shape)
      .map(([key, value]) => ({
        key,
        value,
        rank: ((value.meta() as Record<string, unknown>)?.rank as number) ?? -1,
      }))
      .sort((a, b) => a.rank - b.rank);
    children = ranked.map((r) => ({
      key: r.key,
      schema: r.value,
      rank: r.rank,
    }));
  } else if (schema.type === "union") {
    const ranked = schema.def.options
      .map((option, index) => ({
        option,
        rank:
          ((option.meta() as Record<string, unknown>)?.rank as number) ?? index,
        index,
      }))
      .sort((a, b) => a.rank - b.rank);

    // For discriminated unions, extract the discriminator value from each option
    // @ts-ignore - Zod internal
    const discriminatorKey = schema._def.discriminator;

    children = ranked.map((r) => {
      let key: string;

      if (discriminatorKey && r.option.shape[discriminatorKey]) {
        // Get the literal value from the discriminator field
        const discriminatorField = r.option.shape[discriminatorKey];
        // @ts-ignore - Zod internal
        const literalValues = discriminatorField._def?.values;
        key =
          literalValues?.[0] ??
          getSchemaName(r.option) ??
          r.option.constructor?.name ??
          `option_${r.index}`;
      } else {
        // Fallback for non-discriminated unions
        key =
          getSchemaName(r.option) ??
          r.option.constructor?.name ??
          `option_${r.index}`;
      }

      return { key, schema: r.option, rank: r.rank };
    });
  } else if (schema.type === "array") {
    // For arrays, traverse into the element type as a child
    const element = schema._def.element;
    children = [{ key: "items", schema: element, rank: 0 }];
  }

  // Store metadata in cache (previous/next passed from parent)
  metadataCache.set(schema, {
    uri,
    broader: broaderUri,
    narrower: children.map(({ key, schema: child }) => {
      // Generate child URI using the key/name before recursion
      const childUri = generateUri(uri, child, key);
      return childUri;
    }),
    previous: _previousUri,
    next: _nextUri,
    created: now.toISOString().split("T")[0],
    creator: sourceInfo.gitAuthor ? [sourceInfo.gitAuthor] : [],
    publisher: sourceInfo.packagePublisher ? [sourceInfo.packagePublisher] : [],
  });

  // Recursively collect metadata for children - pass child URIs as _uri
  children.forEach(({ key, schema: child, rank }) => {
    // Calculate previous/next URIs from siblings
    const previousUri =
      rank - 1 >= 0
        ? generateUri(
            uri,
            children[rank - 1]?.schema ?? null,
            children[rank - 1]?.key ?? null,
          )
        : null;
    const nextUri =
      rank + 1 < children.length
        ? generateUri(
            uri,
            children[rank + 1]?.schema ?? null,
            children[rank + 1]?.key ?? null,
          )
        : null;

    // Build the child URI using the key (field name) before recursion
    const childUri = generateUri(uri, child, key);
    collectMetadata(
      child,
      registry,
      sourceInfo,
      uri,
      childUri,
      previousUri,
      nextUri,
    );
  });
}

/**
 * Pass 2: Build augmented schema tree with metadata applied
 *
 * @param schema - The Zod schema to augment
 * @returns New schema with all metadata applied
 */
function buildAugmentedSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  const cached = metadataCache.get(schema);

  // First, recursively build children and reconstruct schema
  let augmentedSchema = schema;

  if (schema.type === "object") {
    // Use extend to preserve original schema type information
    let rebuilt = schema;
    Object.entries(schema.shape).forEach(([key, value]) => {
      const augmentedChild = buildAugmentedSchema(value);
      rebuilt = rebuilt.extend({ [key]: augmentedChild });
    });
    augmentedSchema = rebuilt;
  } else if (schema.type === "union") {
    // Recreate union with augmented options
    // @ts-ignore - Zod internal
    const discriminator = schema._def.discriminator;
    if (discriminator) {
      const augmentedOptions = schema.def.options.map((option) =>
        buildAugmentedSchema(option),
      );
      augmentedSchema = z.discriminatedUnion(discriminator, augmentedOptions);
    } else {
      const augmentedOptions = schema.def.options.map((option) =>
        buildAugmentedSchema(option),
      );
      augmentedSchema = z.union(augmentedOptions);
    }
  } else if (schema.type === "array") {
    // Recreate array with augmented element
    const augmentedElement = buildAugmentedSchema(schema._def.element);
    augmentedSchema = z.array(augmentedElement);
  }

  // Apply metadata from cache if available
  if (cached) {
    augmentedSchema = augmentedSchema.meta({
      ...(schema.meta() as Record<string, unknown>),
      ...cached,
    });
  }

  return augmentedSchema;
}

/**
 * Main augment function that orchestrates the two-pass approach
 */
export function augmentSchema(
  schema: z.ZodTypeAny,
  registry: z.ZodTypeAny,
): z.ZodTypeAny {
  const sourceInfo = getSourceInfo();

  // Clear cache and run two-pass augmentation
  metadataCache.clear();
  collectMetadata(
    schema,
    registry,
    sourceInfo,
    `#/${registry.get(schema).registry}`,
  );
  return buildAugmentedSchema(schema);
}

export { getSourceInfo } from "./sources";
export type { SchemaMetadata, FieldMetadata, SourceInfo } from "./types";
