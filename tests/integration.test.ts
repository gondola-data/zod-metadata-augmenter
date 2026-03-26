/**
 * Integration Tests
 * 
 * End-to-end tests simulating real-world DataProvider scenarios
 */

import { describe, it, expect } from "vitest"
import * as z from "zod"
import { augment, augmentSchemas } from "../src/augment"

// Helper to extract metadata from augmented schema
function getMetadata(schema: z.ZodTypeAny): any {
  // @ts-ignore - Internal Zod API
  return schema._metadata
}

describe("DataProvider Integration Tests", () => {
  describe("Personas Schema", () => {
    it("should augment personas schema with correct URI pattern", () => {
      const DataProviderPersonasSchema = z
        .object({
          name: z.string().meta({ rank: 0 }),
          function: z.string().meta({ rank: 1 }),
          email: z.string().email().meta({ rank: 2 }),
        })
        .meta({ rank: 2 })

      const augmented = augment(DataProviderPersonasSchema, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
      })

      const meta = getMetadata(augmented)
      
      // Verify URI structure
      expect(meta.uri).toBe("#/taxonomy/concept/data-provider/item/personas")
      expect(meta.broader).toBe("#/taxonomy/concept/data-provider")
      
      // Verify rank is preserved
      expect(meta.rank).toBe(2)
      
      // Verify timestamp is set
      expect(meta.created).toBeDefined()
    })

    it("should augment field metadata for personas", () => {
      const DataProviderPersonasSchema = z
        .object({
          name: z.string().meta({ rank: 0 }),
          function: z.string().meta({ rank: 1 }),
          email: z.string().email().meta({ rank: 2 }),
        })
        .meta({ rank: 2 })

      const augmented = augment(DataProviderPersonasSchema, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
        augmentFields: true,
      })

      // @ts-ignore - Access shape
      const nameMeta = augmented.shape.name._metadata
      const emailMeta = augmented.shape.email._metadata

      expect(nameMeta?.uri).toContain("resource/name")
      expect(emailMeta?.uri).toContain("resource/email")
      expect(nameMeta?.rank).toBe(0)
    })
  })

  describe("Authentication Schema", () => {
    it("should augment authentication discriminated union", () => {
      const AuthDatabaseSchema = z.object({
        type: z.literal("database"),
        host: z.string(),
      })

      const AuthApiSchema = z.object({
        type: z.literal("api"),
        baseUrl: z.string(),
      })

      const AuthenticationSchema = z.discriminatedUnion("type", [
        AuthDatabaseSchema,
        AuthApiSchema,
      ])

      const augmented = augment(AuthenticationSchema, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
      })

      const meta = getMetadata(augmented)
      
      // Root authentication concept
      expect(meta.uri).toBe("#/taxonomy/concept/data-provider/authentication")
      expect(meta.narrower).toHaveLength(2)
      expect(meta.narrower?.[0]).toContain("item/database")
      expect(meta.narrower?.[1]).toContain("item/api")
    })
  })

  describe("Full DataProvider Schema Chain", () => {
    it("should create proper linked list for multiple schemas", () => {
      const schemas = {
        PersonasSchema: z.object({
          name: z.string(),
        }).meta({ rank: 2 }),
        
        LifeCycleSchema: z.object({
          status: z.string(),
        }).meta({ rank: 3 }),
        
        ProductStatusSchema: z.object({
          status: z.string(),
        }).meta({ rank: 4 }),
      }

      const augmented = augmentSchemas(schemas, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
      })

      const personasMeta = getMetadata(augmented.PersonasSchema)
      const lifeCycleMeta = getMetadata(augmented.LifeCycleSchema)
      const productStatusMeta = getMetadata(augmented.ProductStatusSchema)

      // Verify linked list
      expect(personasMeta.next).toContain("life-cycle")
      expect(lifeCycleMeta.previous).toContain("personas")
      expect(lifeCycleMeta.next).toContain("product-status")
      expect(productStatusMeta.previous).toContain("life-cycle")
    })
  })

  describe("Creator/Publisher Integration", () => {
    it("should include source attribution in metadata", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({ rank: 1 })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
      })

      const meta = getMetadata(augmented)
      
      // Verify created timestamp exists
      expect(meta.created).toBeDefined()
      
      // Creator and publisher should be arrays (may be empty if no git/package.json)
      expect(Array.isArray(meta.creator)).toBe(true)
      expect(Array.isArray(meta.publisher)).toBe(true)
    })

    it("should use explicit creator/publisher when provided", () => {
      const schema = z.object({
        name: z.string(),
      })

      const augmented = augment(schema, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
        creator: ["jason.grein@gmail.com"],
        publisher: ["Gondola"],
      })

      const meta = getMetadata(augmented)
      
      expect(meta.creator).toContain("jason.grein@gmail.com")
      expect(meta.publisher).toContain("Gondola")
    })
  })

  describe("Date Format Options", () => {
    it("should support different date formats", () => {
      const schema = z.object({ name: z.string() })

      // ISO format (default)
      const isoAugmented = augment(schema, {
        baseUri: "#/taxonomy/concept/test",
        domain: "test",
        dateFormat: "iso",
      })
      
      // Date only
      const dateAugmented = augment(schema, {
        baseUri: "#/taxonomy/concept/test",
        domain: "test",
        dateFormat: "date",
      })

      // Timestamp
      const timestampAugmented = augment(schema, {
        baseUri: "#/taxonomy/concept/test",
        domain: "test",
        dateFormat: "timestamp",
      })

      expect(getMetadata(isoAugmented).created).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(getMetadata(dateAugmented).created).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(getMetadata(timestampAugmented).created).toMatch(/^\d{13}$/)
    })
  })

  describe("Real-world DataProvider scenario", () => {
    it("should match expected DataProvider structure", () => {
      // Simulating the DataProvider schema structure from App.tsx
      const DataProviderPersonasSchema = z
        .object({
          name: z.string().meta({ rank: 0 }),
          function: z.string().meta({ rank: 1 }),
          email: z.string().email().meta({ rank: 2 }),
        })
        .meta({ rank: 2 })

      const DataProviderLifeCycleSchema = z
        .object({
          status: z.string().meta({ rank: 0 }),
          effectiveDate: z.string().meta({ rank: 1 }),
          note: z.string().meta({ rank: 2 }),
        })
        .meta({ rank: 3 })

      // Augment each schema with siblings context
      const augmented = augmentSchemas({
        DataProviderPersonasSchema,
        DataProviderLifeCycleSchema,
      }, {
        baseUri: "#/taxonomy/concept/data-provider",
        domain: "data-provider",
      })

      const personasMeta = getMetadata(augmented.DataProviderPersonasSchema)
      const lifeCycleMeta = getMetadata(augmented.DataProviderLifeCycleSchema)

      // Verify the chain structure
      expect(personasMeta.uri).toBe("#/taxonomy/concept/data-provider/item/personas")
      expect(personasMeta.next).toBe(lifeCycleMeta.uri)
      
      expect(lifeCycleMeta.uri).toBe("#/taxonomy/concept/data-provider/item/life-cycle")
      expect(lifeCycleMeta.previous).toBe(personasMeta.uri)
      
      // Verify ranks are preserved
      expect(personasMeta.rank).toBe(2)
      expect(lifeCycleMeta.rank).toBe(3)
    })
  })
})
