<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.1 | Updated: 2026-04-02 -->

# Technical Domain

> Zod schema augmenter that adds SKOS-inspired metadata from package.json and git sources.

## Quick Reference

- **Purpose**: Understand the technical foundation of zod-metadata-augmenter
- **Update When**: New features, refactoring, tech stack changes
- **Audience**: Developers, contributors

## Primary Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | TypeScript | ^5.0.0 | Type safety, IDE support |
| Runtime | Node.js | ^22.0.0 | CLI execution |
| Package Manager | npm | - | Standard Node ecosystem |
| Schema Validation | Zod | ^4.0.0 | Core schema manipulation |
| Testing | Vitest | ^2.0.0 | Fast unit tests |
| Build | tsup | ^8.0.0 | Bundle to ESM/CJS |

## Project Structure

```
zod-metadata-augmenter/
├── src/
│   ├── index.ts           # Browser entry (traversal only)
│   ├── index.cli.ts      # CLI exports
│   ├── augment.ts         # Core augmentation logic
│   ├── traversal.ts       # Schema tree traversal utilities
│   ├── types.ts           # Type definitions
│   ├── cli.ts             # CLI implementation
│   └── sources/          # Metadata source integrations
│       ├── index.ts
│       ├── package.ts     # package.json metadata
│       └── git.ts         # git config metadata
├── tests/                 # Vitest test suite
├── example/               # Usage examples
└── package.json
```

**Key Directories**:
- `src/` - Core library, browser-safe traversal exports
- `src/sources/` - External data source integrations (package.json, git)
- `tests/` - Unit and integration tests

## Architecture Pattern

**Type**: Library/CLI hybrid
**Pattern**: Two-pass schema augmentation

```
Pass 1 (collectMetadata):  Traverse tree → cache metadata in Map
Pass 2 (buildAugmentedSchema): Rebuild tree → apply metadata from cache
```

**Why Two-Pass?** Zod schemas are immutable (`schema.meta()` returns NEW instance), so naive recursion fails. Cache-first approach solves this.

## Key Technical Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Zod v4 | Stable meta() API | Schema augmentation works reliably |
| SKOS taxonomy | Industry-standard metadata format | Interoperable, meaningful URIs |
| Browser-safe core | No Node.js deps in index.ts | Can use in browser environments |
| Two-pass traversal | Immutable Zod schema semantics | Correct metadata propagation |

## Development Environment

```
Setup:   npm install
Build:   npm run build
Test:    npm test
Typecheck: npm run typecheck
Dev:     npm run dev
Example: npm run example:augmenter
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | traversal.ts, index-cli.ts |
| Types/Classes | PascalCase | TraversalNode, SchemaMetadata |
| Functions | camelCase | createTraversalObject, findByUri |
| Constants | SCREAMING_SNAKE_CASE | MAX_DEPTH |

## Code Patterns

### Schema Augmentation (Two-Pass)
```typescript
// Pass 1: Collect metadata
const cache = new Map<ZodTypeAny, SchemaMetadata>();
collectMetadata(schema, cache, sourceInfo);

// Pass 2: Apply metadata
const augmented = buildAugmentedSchema(schema, cache);
```

### Traversal API
```typescript
import { createTraversalObject, traverseAll } from "./traversal";

const tree = createTraversalObject(schema);
const nodes = traverseAll(tree);
```

### CLI Entry Point
```typescript
// Browser-safe: imports from ./index
// CLI: imports from ./cli - has Node.js deps
```

## Code Standards

- TypeScript strict mode enabled
- JSDoc comments for public APIs
- Null-safety: explicit null checks over implicit undefined
- Zod internals accessed via `_def` (documented instability)

## Security Requirements

- Input validation via Zod (all external inputs)
- No arbitrary code execution
- Read-only git/package.json access

## 📂 Codebase References

**Core Logic**: `src/augment.ts` - Two-pass augmentation (lines 1-100)
**Traversal**: `src/traversal.ts` - Schema tree utilities
**Types**: `src/types.ts` - SchemaMetadata, FieldMetadata types
**CLI**: `src/cli.ts` - Command-line interface
**Tests**: `tests/augment.test.ts`, `tests/traversal.test.ts`
**Package Sources**: `src/sources/package.ts` - package.json metadata extraction

## Related Files

- `business-domain.md` - Business context
- `decisions-log.md` - Decision history
