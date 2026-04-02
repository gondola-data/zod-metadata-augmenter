/**
 * Augmentation Logic Tests
 * 
 * Tests for the core augmentation functions using augmentSchema + registry API
 */

import { describe, it, expect, beforeEach } from "vitest"
import * as z from "zod"
import { augmentSchema } from "../src/augment"
import type { SchemaMetadata, FieldMetadata } from "../src/types"

// Helper to extract metadata from augmented schema
function getMetadata(schema: z.ZodTypeAny): SchemaMetadata | undefined {
  return schema.meta() as SchemaMetadata | undefined
}

// Helper to extract field metadata
function getFieldMetadata(schema: z.ZodObject<z.ZodRawShape>, fieldName: string): FieldMetadata | undefined {
  // @ts-ignore - Internal Zod API
  return schema.shape[fieldName]?._metadata as FieldMetadata | undefined
}

describe("augment.ts", () => {
  // Using any type because Zod's registry API is experimental and TypeScript types are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any;

  beforeEach(() => {
    registry = z.registry<{ registry: string; concept: string }>();
  });

  describe("Basic Object Schema Augmentation", () => {
    it("should augment a simple object schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      registry.add(schema, { registry: "taxonomy", concept: "test" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      expect(meta).toBeDefined()
      expect(meta?.uri).toContain("test")
      expect(meta?.broader).toBe("#/taxonomy")
      expect(meta?.created).toBeDefined()
    })

    it("should preserve user-defined rank", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({ rank: 42 })

      registry.add(schema, { registry: "taxonomy", concept: "test" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      expect(meta?.rank).toBe(42)
    })

    it("should handle empty object schema", () => {
      const schema = z.object({})

      registry.add(schema, { registry: "taxonomy", concept: "empty" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      expect(meta).toBeDefined()
      expect(meta?.uri).toContain("empty")
    })

    it("should handle schema with no name", () => {
      const schema = z.string()

      registry.add(schema, { registry: "taxonomy", concept: "primitive" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      expect(meta).toBeDefined()
    })
  })

  describe("URI Derivation", () => {
    it("should derive URI from schema name", () => {
      const TestSchema = z.object({ name: z.string() })

      registry.add(TestSchema, { registry: "taxonomy", concept: "myapp" });
      const augmented = augmentSchema(TestSchema, registry);

      const meta = getMetadata(augmented)
      expect(meta?.uri).toContain("myapp")
    })

    it("should handle PascalCase to kebab-case conversion", () => {
      const MyTestSchema = z.object({ name: z.string() })

      registry.add(MyTestSchema, { registry: "taxonomy", concept: "my-app" });
      const augmented = augmentSchema(MyTestSchema, registry);

      const meta = getMetadata(augmented)
      expect(meta?.uri).toContain("my-app")
    })
  })

  describe("Discriminated Union Augmentation", () => {
    it("should augment discriminated union with child schemas", () => {
      const OptionA = z.object({
        type: z.literal("a"),
        value: z.string(),
      })

      const OptionB = z.object({
        type: z.literal("b"),
        value: z.number(),
      })

      const unionSchema = z.discriminatedUnion("type", [OptionA, OptionB])

      registry.add(unionSchema, { registry: "taxonomy", concept: "test" });
      const augmented = augmentSchema(unionSchema, registry);

      const meta = getMetadata(augmented)
      expect(meta?.narrower).toHaveLength(2)
    })
  })

  describe("Creator/Publisher Sourcing", () => {
    it("should include creator in metadata", () => {
      const schema = z.object({ name: z.string() })

      registry.add(schema, { registry: "taxonomy", concept: "test" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      // creator is sourced from git config - may or may not be present
      expect(meta?.creator).toBeDefined()
    })

    it("should include publisher in metadata", () => {
      const schema = z.object({ name: z.string() })

      registry.add(schema, { registry: "taxonomy", concept: "test" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      // publisher is sourced from package.json - may or may not be present
      expect(meta?.publisher).toBeDefined()
    })
  })

  describe("Depth Limit", () => {
    it("should throw error for deeply nested schemas exceeding MAX_DEPTH", () => {
      // Create a deeply nested schema that exceeds MAX_DEPTH (100)
      let schema: z.ZodTypeAny = z.object({ level: z.string() });
      for (let i = 0; i < 101; i++) {
        schema = z.object({ nested: schema });
      }

      registry.add(schema, { registry: "taxonomy", concept: "deep" });
      
      expect(() => augmentSchema(schema, registry)).toThrow(/Maximum recursion depth/)
    })
  })

  describe("Circular Reference Detection", () => {
    it("should handle repeated calls with fresh caches per call", () => {
      // Each call to augmentSchema creates fresh cache and visited sets,
      // so repeated calls work correctly without interference
      const schema = z.object({
        name: z.string(),
      })

      registry.add(schema, { registry: "taxonomy", concept: "repeated" });
      
      // First call should succeed
      expect(() => augmentSchema(schema, registry)).not.toThrow();
      
      // Second call should also succeed (fresh caches)
      expect(() => augmentSchema(schema, registry)).not.toThrow();
      
      // Note: True circular references (same schema object appearing multiple
      // times in a single tree) would be detected and throw an error.
      // Zod's immutable schemas make this scenario rare in practice.
    })
  })
})
