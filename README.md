# @gondola-data/zod-schema-augmenter

> Automatically augment Zod schemas with SKOS-inspired metadata, sourced from industry-standard configurations. Generate build-time JSON Schemas with preserved metadata for React applications.

## Features

- **Automatic URI Generation** - Derives URIs from schema names following taxonomy conventions
- **Hierarchical Relationships** - Infers `broader` and `narrower` from schema structure
- **Sequential Navigation** - Infers `previous` and `next` from discriminated union ordering
- **Source Metadata** - Pulls `creator` and `publisher` from:
  - `package.json` (npm/pnpm conventions)
  - Git config (user.email, user.name)
- **Preserves User Data** - Keeps user-defined attributes like `rank`
- **Build-time Generation** - CLI tool to generate JSON Schemas at build time
- **Metadata Preservation** - Read JSON Schema back into Zod while preserving all custom metadata
- **Schema Traversal** - Navigate augmented schemas using metadata relationships (narrower, previous, next)

## Installation

```bash
npm install @gondola-data/zod-schema-augmenter
# or
pnpm add @gondola-data/zod-schema-augmenter
```

## Browser vs CLI Entry Points

This package provides two entry points for different use cases:

### Browser Entry (Default)

The default entry point is browser-safe and includes only **traversal functionality**. It has no Node.js dependencies (fs, path, child_process) and works with any browser bundler.

```bash
# Install normally
npm install @gondola-data/zod-schema-augmenter
```

```typescript
// Import traversal only (browser-safe)
import { createTraversalObject, findByUri } from "@gondola-data/zod-schema-augmenter";
```

**Exports:**
- `createTraversalObject`, `findByUri`, `getNodesAtDepth`, `getPathToNode`
- `traverseAll`, `getSiblings`, `getNodeDepth`, `countNodes`

### CLI Entry

The CLI entry point includes full functionality with source detection from git config and package.json.

```json
// package.json - explicitly use CLI entry
{
  "dependencies": {
    "@gondola-data/zod-schema-augmenter": "github:gondola-data/zod-metadata-augmenter"
  }
}
```

```typescript
// Import full functionality (Node.js required)
import { augmentSchema, getSourceInfo } from "@gondola-data/zod-schema-augmenter/cli";
```

**CLI Usage:**
```bash
npx zod-augmenter build --input schema.ts --output dist/schema.json
```

Or import programmatically:
```typescript
import { augmentSchema, createTraversalObject } from "@gondola-data/zod-schema-augmenter/cli";
```

### Entry Point Summary

| Entry | Import Path | Use Case |
|-------|-------------|----------|
| Default (`.`) | `@gondola-data/zod-schema-augmenter` | Browser apps - traversal only |
| CLI (`./cli`) | `@gondola-data/zod-schema-augmenter/cli` | Node.js/CLI - full features |

---

## Quick Start

### Runtime Usage

```typescript
import * as z from "zod";
import { augmentSchema } from "@gondola-data/zod-schema-augmenter";

// Define schema with rank (user-defined ordering)
const UserSchema = z.object({
  name: z.string().meta({ rank: 0 }),
  email: z.string().email().meta({ rank: 1 }),
});

// Create a registry to track schema metadata
const MyRegistry = z.registry<{ registry: string; concept: string }>();

// Register the schema with a concept name
MyRegistry.add(UserSchema, {
  registry: "taxonomy",
  concept: "user",
});

// Augment with automatic metadata
const augmented = augmentSchema(UserSchema, MyRegistry);

// Access augmented metadata via .meta()
const meta = augmented.meta();
console.log(meta.uri);
// => "#/taxonomy/concept/user"
```

### Build-time Usage (CLI)

Generate enriched JSON Schemas at build time for use in React applications:

```bash
npx zod-augmenter build \
  --input schema.ts \
  --output dist/schema.json \
  --registry taxonomy \
  --concept user
```

### Reading JSON Schema Back

Zod v4 supports reading JSON Schema back while preserving custom metadata:

```typescript
import * as z from "zod";
import * as fs from "fs";

// Read the JSON Schema file
const jsonSchema = JSON.parse(fs.readFileSync("dist/schema.json", "utf-8"));

// Parse back to Zod - metadata is preserved!
const zodSchema = z.fromJSONSchema(jsonSchema);

const meta = zodSchema.meta();
console.log(meta.broader);   // "#/taxonomy"
console.log(meta.narrower);  // ["#/taxonomy/concept/user/item/name", ...]
```

### Schema Traversal

After augmenting a schema, you can create a traversal object to navigate through the schema tree using metadata relationships:

```typescript
import * as z from "zod";
import { augmentSchema, createTraversalObject } from "@gondola-data/zod-schema-augmenter";

const UserSchema = z.object({
  name: z.string().meta({ rank: 0 }),
  email: z.string().email().meta({ rank: 1 }),
  profile: z.object({
    bio: z.string().meta({ rank: 0 }),
  }).meta({ rank: 2 }),
});

const registry = z.registry<{ registry: string; concept: string }>();
registry.add(UserSchema, { registry: "taxonomy", concept: "user" });

const augmented = augmentSchema(UserSchema, registry);
const traversal = createTraversalObject(augmented);

// Navigate children
traversal.narrower[0].meta.uri  // First child field

// Navigate nested fields
const profile = traversal.narrower.find(n => n.meta.uri.includes("profile"));
profile?.narrower[0].meta.uri   // bio field

// O(1) URI lookup
traversal.byUri("#/taxonomy/concept/user/item/profile/resource/bio")?.meta.rank

// Get path from root to any node
import { getPathToNode, getSiblings, traverseAll } from "@gondola-data/zod-schema-augmenter";
const path = getPathToNode(traversal, "#/taxonomy/concept/user/item/profile");
```

#### Traversal API

| Function | Description |
|----------|-------------|
| `createTraversalObject(schema)` | Creates a navigable tree from an augmented schema |
| `traversal.narrower` | Array of child nodes |
| `traversal.previous` | Previous sibling node |
| `traversal.next` | Next sibling node |
| `traversal.byUri(uri)` | O(1) lookup by URI |
| `findByUri(root, uri)` | Find node by URI |
| `getPathToNode(root, uri)` | Get path from root to target |
| `getSiblings(node)` | Get all sibling nodes |
| `traverseAll(root)` | Iterate all nodes (generator) |
| `getNodeDepth(root, node)` | Get depth of a node |
| `countNodes(root)` | Count total nodes |

See `example/traversal-demo.ts` for a complete example with the DataProvider schema.

## CLI Reference

### Installation

After installing the package, the CLI is available via `npx`:

```bash
npx zod-augmenter build [options]
```

### Options

| Option | Short | Required | Description |
|--------|-------|----------|-------------|
| `--input` | `-i` | Yes | Path to TypeScript file exporting the schema |
| `--output` | `-o` | Yes | Output path for the JSON Schema file |
| `--registry` | `-r` | Yes | Registry name (e.g., "taxonomy") |
| `--concept` | `-c` | Yes | Root concept name (e.g., "user") |
| `--export` | `-e` | No | Export name in input file (default: "schema") |
| `--help` | `-h` | No | Show help message |

### Example

```bash
# Generate JSON Schema from a schema file
npx zod-augmenter build \
  --input ./schemas/data-provider.ts \
  --output ./dist/data-provider-schema.json \
  --registry taxonomy \
  --concept data-provider \
  --export DataProviderSchema

# Output:
# ✅ JSON Schema written to: ./dist/data-provider-schema.json
#    URI: #/taxonomy/concept/data-provider
#    Broader: #/taxonomy
```

## Input File Format

The CLI expects a TypeScript file that exports a Zod schema:

```typescript
// schema.ts
import * as z from "zod";

export const DataProviderSchema = z.object({
  name: z.string().meta({ rank: 0 }),
  email: z.string().email().meta({ rank: 1 }),
});
```

## Metadata Schema

### SchemaMetadata

```typescript
interface SchemaMetadata {
  uri: string;           // Unique identifier in taxonomy
  broader: string | null;     // Parent concept URI
  narrower: string[];        // Child concept URIs
  previous: string | null;   // Previous sibling URI
  next: string | null;       // Next sibling URI
  created: string;           // ISO 8601 date
  creator: string[];         // Creators (from git/package.json)
  publisher: string[];       // Publishers (from package.json)
  rank: number;              // User-defined ordinal position
}
```

### FieldMetadata

```typescript
interface FieldMetadata {
  uri: string;     // Resource URI
  rank: number;    // User-defined field order
}
```

## Source Precedence

### Creator
1. Explicit option
2. Git `user.email` config
3. Package.json `author`

### Publisher
1. Explicit option  
2. Package.json `publisher` or `author.name`

## URI Convention

The utility follows this URI pattern:

```
#/{registry}/{node_type}/{concept}[/item/{item}][/resource/{field}]
```

Examples:
- Root concept: `#/taxonomy/concept/data-provider`
- Item: `#/taxonomy/concept/data-provider/item/basic`
- Field: `#/taxonomy/concept/data-provider/item/basic/resource/name`

## How It Works

### Two-Pass Augmentation

Zod schemas are immutable - calling `.meta()` returns a NEW schema instance rather than modifying in place. A naive recursive approach fails because child schemas are augmented but never captured.

This library uses a **two-pass approach**:

1. **Pass 1** (`collectMetadata`): Traverses the entire schema tree and stores all computed metadata in a cache (Map). Does NOT apply metadata yet.
2. **Pass 2** (`buildAugmentedSchema`): Rebuilds the schema tree from scratch, applying metadata from the cache at each step.

### URI Construction

Field names must be known BEFORE recursing into child schemas. If we generated URIs inside the recursion, parents wouldn't know their children's names.

Solution: Pass the child name via the `_uri` parameter - pre-compute the child URI in the parent before recursing.

### Discriminated Unions

For discriminated unions, the library extracts the discriminator value (e.g., "database", "api") from the union options to use as the child name in URIs.

### Array Handling

Arrays are handled by traversing into the element type. The array itself doesn't get metadata - its element type becomes the child.

## License

MIT