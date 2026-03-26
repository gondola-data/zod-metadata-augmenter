# @json-form/zod-schema-augmenter

> Automatically augment Zod schemas with SKOS-inspired metadata, sourced from industry-standard configurations.

## Features

- **Automatic URI Generation** - Derives URIs from schema names following taxonomy conventions
- **Hierarchical Relationships** - Infers `broader` and `narrower` from schema structure
- **Sequential Navigation** - Infers `previous` and `next` from discriminated union ordering
- **Source Metadata** - Pulls `creator` and `publisher` from:
  - `package.json` (npm/pnpm conventions)
  - Git config (user.email, user.name)
- **Preserves User Data** - Keeps user-defined attributes like `rank`

## Installation

```bash
npm install @json-form/zod-schema-augmenter
# or
pnpm add @json-form/zod-schema-augmenter
```

## Quick Start

```typescript
import * as z from "zod"
import { augment } from "@json-form/zod-schema-augmenter"

// Define schema with only rank (user-defined)
const UserSchema = z
  .object({
    name: z.string().meta({ rank: 0 }),
    email: z.string().email().meta({ rank: 1 }),
  })
  .meta({ rank: 1 })

// Create a registry to track schema metadata
const MyRegistry = z.registry<{ registry: string; concept: string }>()

// Register the schema with a concept name
MyRegistry.add(UserSchema, {
  registry: "taxonomy",
  concept: "user",
})

// Augment with automatic metadata
const augmented = augment(UserSchema, MyRegistry)

// Access augmented metadata via .meta()
const meta = augmented.meta()
console.log(meta.uri)
// => "#/taxonomy/user/item/user"
```

## Configuration

## Metadata Schema

### SchemaMetadata

```typescript
interface SchemaMetadata {
  uri: string                    // Unique identifier in taxonomy
  broader: string | null         // Parent concept URI
  narrower: string[]            // Child concept URIs
  previous: string | null       // Previous sibling URI
  next: string | null          // Next sibling URI
  created: string              // ISO 8601 timestamp
  creator: string[]           // Creators (from git/package.json)
  publisher: string[]         // Publishers (from package.json)
  rank: number               // User-defined ordinal position
}
```

### FieldMetadata

```typescript
interface FieldMetadata {
  uri: string          // Resource URI
  rank: number       // User-defined field order
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
#/{baseUri}/{domain}/{concept}[/item/{item}][/resource/{field}]
```

Examples:
- Root concept: `#/taxonomy/concept/data-provider/authentication`
- Item: `#/taxonomy/concept/data-provider/authentication/item/database`
- Field: `#/taxonomy/concept/data-provider/authentication/item/database/resource/host`

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

For discriminated unions, the library extracts the discriminator value (e.g., "database", "api") from `option.shape[discriminatorKey]._def.values[0]` to use as the child name in URIs.

### Array Handling

Arrays are handled by traversing into `schema._def.element`. The array itself doesn't get metadata - its element type becomes the child.

## License

MIT
