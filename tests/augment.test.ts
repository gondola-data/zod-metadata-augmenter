/**
 * Augmentation Logic Tests
 * 
 * Tests for the core augmentation functions
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import * as z from "zod"
import { augment, augmentSchemas } from "../src/augment"
import type { SchemaMetadata, FieldMetadata } from "../src/types"

// Helper to extract metadata from augmented schema
function getMetadata(schema: z.ZodTypeAny): SchemaMetadata | undefined {
  // @ts-ignore - Internal Zod API
  return schema._metadata as SchemaMetadata | undefined
}

// Helper to extract field metadata
function getFieldMetadata(schema: z.ZodObject<z.ZodRawShape>, fieldName: string): FieldMetadata | undefined {
  // @ts-ignore - Internal Zod API
  return schema.shape[fieldName]?._metadata as FieldMetadata | undefined
}

describe("augment.ts", () => {
  describe("Basic Object Schema Augmentation", () => {
    it("should augment a simple object schema", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta).toBeDefined()
      expect(meta?.uri).toContain("test/schema")
      expect(meta?.broader).toBe("#/taxonomy/concept/test")
      expect(meta?.created).toBeDefined()
    })

    it("should preserve user-defined rank", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({ rank: 42 })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.rank).toBe(42)
    })

    it("should not overwrite rank when preserveExisting is false", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({ rank: 42 })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        preserveExisting: false,
      })

      const meta = getMetadata(augmented)
      expect(meta?.rank).toBe(-1)
    })
  })

  describe("URI Derivation", () => {
    it("should derive URI from schema name", () => {
      const TestSchema = z.object({ name: z.string() })

      const augmented = augment(TestSchema, {
        baseUri: "#/taxonomy/concept",
        domain: "myapp",
      })

      const meta = getMetadata(augmented)
      expect(meta?.uri).toBe("#/taxonomy/concept/myapp/test")
    })

    it("should handle PascalCase to kebab-case conversion", () => {
      const MyTestSchema = z.object({ name: z.string() })

      const augmented = augment(MyTestSchema, {
        baseUri: "#/taxonomy/concept",
        domain: "myapp",
      })

      const meta = getMetadata(augmented)
      expect(meta?.uri).toBe("#/taxonomy/concept/myapp/my-test")
    })

    it("should handle DataProvider prefix stripping", () => {
      const DataProviderUserSchema = z.object({ name: z.string() })

      const augmented = augment(DataProviderUserSchema, {
        baseUri: "#/taxonomy/concept",
        domain: "myapp",
      })

      const meta = getMetadata(augmented)
      expect(meta?.uri).toBe("#/taxonomy/concept/myapp/user")
    })
  })

  describe("Discriminated Union Augmentation", () => {
    it("should augment discriminated union with child schemas", () => {
      const discriminatorSchema = z.discriminatedUnion("type", [
        z.object({ type: z.literal("a"), valueA: z.string() }),
        z.object({ type: z.literal("b"), valueB: z.number() }),
      ])

      const augmented = augment(discriminatorSchema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.narrower).toHaveLength(2)
      expect(meta?.narrower?.[0]).toContain("item/a")
      expect(meta?.narrower?.[1]).toContain("item/b")
    })

    it("should set broader for union members", () => {
      const discriminatorSchema = z.discriminatedUnion("type", [
        z.object({ type: z.literal("a"), valueA: z.string() }),
        z.object({ type: z.literal("b"), valueB: z.number() }),
      ])

      const augmented = augment(discriminatorSchema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.broader).toBe("#/taxonomy/concept/test")
    })
  })

  describe("Field Augmentation", () => {
    it("should augment fields when augmentFields is true", () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        augmentFields: true,
      })

      const nameMeta = getFieldMetadata(augmented, "name")
      const emailMeta = getFieldMetadata(augmented, "email")

      expect(nameMeta?.uri).toContain("resource/name")
      expect(emailMeta?.uri).toContain("resource/email")
    })

    it("should not augment fields when augmentFields is false", () => {
      const schema = z.object({
        name: z.string(),
      })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        augmentFields: false,
      })

      const nameMeta = getFieldMetadata(augmented, "name")
      expect(nameMeta).toBeUndefined()
    })

    it("should preserve user-defined field rank", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 5 }),
      })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        augmentFields: true,
      })

      const nameMeta = getFieldMetadata(augmented, "name")
      expect(nameMeta?.rank).toBe(5)
    })
  })

  describe("Date Format Options", () => {
    it("should generate ISO date format by default", () => {
      const schema = z.object({ name: z.string() })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.created).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it("should generate date-only format", () => {
      const schema = z.object({ name: z.string() })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        dateFormat: "date",
      })

      const meta = getMetadata(augmented)
      expect(meta?.created).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it("should generate timestamp format", () => {
      const schema = z.object({ name: z.string() })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        dateFormat: "timestamp",
      })

      const meta = getMetadata(augmented)
      expect(meta?.created).toMatch(/^\d+$/)
    })
  })

  describe("Metadata Preservation", () => {
    it("should preserve existing narrower array", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({
        narrower: ["#/custom/uri"],
      } as any)

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        preserveExisting: true,
      })

      const meta = getMetadata(augmented)
      expect(meta?.narrower).toContain("#/custom/uri")
    })

    it("should not preserve when preserveExisting is false", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({
        narrower: ["#/custom/uri"],
      } as any)

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        preserveExisting: false,
      })

      const meta = getMetadata(augmented)
      expect(meta?.narrower).toEqual([])
    })
  })

  describe("augmentSchemas", () => {
    it("should augment multiple schemas", () => {
      const schemas = {
        UserSchema: z.object({ name: z.string() }),
        PostSchema: z.object({ title: z.string() }),
      }

      const augmented = augmentSchemas(schemas, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const userMeta = getMetadata(augmented.UserSchema)
      const postMeta = getMetadata(augmented.PostSchema)

      expect(userMeta?.uri).toContain("user")
      expect(postMeta?.uri).toContain("post")
    })

    it("should set previous/next for sibling schemas", () => {
      const schemas = {
        FirstSchema: z.object({ a: z.string() }),
        SecondSchema: z.object({ b: z.string() }),
        ThirdSchema: z.object({ c: z.string() }),
      }

      const augmented = augmentSchemas(schemas, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const firstMeta = getMetadata(augmented.FirstSchema)
      const secondMeta = getMetadata(augmented.SecondSchema)
      const thirdMeta = getMetadata(augmented.ThirdSchema)

      expect(firstMeta?.next).toBeDefined()
      expect(secondMeta?.previous).toBeDefined()
      expect(secondMeta?.next).toBeDefined()
      expect(thirdMeta?.next).toBeNull()
    })
  })

  describe("Creator/Publisher Sourcing", () => {
    it("should use explicit creator when provided", () => {
      const schema = z.object({ name: z.string() })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        creator: ["custom@creator.com"],
      })

      const meta = getMetadata(augmented)
      expect(meta?.creator).toContain("custom@creator.com")
    })

    it("should use explicit publisher when provided", () => {
      const schema = z.object({ name: z.string() })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
        publisher: ["Custom Publisher"],
      })

      const meta = getMetadata(augmented)
      expect(meta?.publisher).toContain("Custom Publisher")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty object schema", () => {
      const schema = z.object({})

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.uri).toBeDefined()
    })

    it("should handle schema with no name", () => {
      const schema = z.string()

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept",
        domain: "test",
      })

      const meta = getMetadata(augmented)
      expect(meta?.uri).toBeDefined()
    })
  })
})
