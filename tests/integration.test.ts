/**
 * Integration Tests
 * 
 * End-to-end tests simulating real-world DataProvider scenarios
 */

import { describe, it, expect, beforeEach } from "vitest"
import * as z from "zod"
import { augmentSchema } from "../src/augment"

// Helper to extract metadata from augmented schema
function getMetadata(schema: z.ZodTypeAny): any {
  return schema.meta()
}

describe("DataProvider Integration Tests", () => {
  // Using any type because Zod's registry API is experimental and TypeScript types are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any;

  beforeEach(() => {
    registry = z.registry<{ registry: string; concept: string }>();
  });

  describe("Personas Schema", () => {
    it("should augment personas schema with metadata", () => {
      const DataProviderPersonasSchema = z
        .object({
          name: z.string().meta({ rank: 0 }),
          function: z.string().meta({ rank: 1 }),
          email: z.string().email().meta({ rank: 2 }),
        })
        .meta({ rank: 2 })

      registry.add(DataProviderPersonasSchema, { registry: "taxonomy", concept: "data-provider" });
      const augmented = augmentSchema(DataProviderPersonasSchema, registry);

      const meta = getMetadata(augmented)
      
      // Verify URI structure
      expect(meta.uri).toBeDefined()
      expect(meta.broader).toBe("#/taxonomy")
      
      // Verify rank is preserved
      expect(meta.rank).toBe(2)
      
      // Verify timestamp is set
      expect(meta.created).toBeDefined()
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

      registry.add(AuthenticationSchema, { registry: "taxonomy", concept: "data-provider" });
      const augmented = augmentSchema(AuthenticationSchema, registry);

      const meta = getMetadata(augmented)
      
      // Root authentication concept
      expect(meta.uri).toBeDefined()
      expect(meta.narrower).toHaveLength(2)
    })
  })

  describe("Creator/Publisher Integration", () => {
    it("should include source attribution in metadata", () => {
      const schema = z.object({
        name: z.string(),
      }).meta({ rank: 1 })

      registry.add(schema, { registry: "taxonomy", concept: "data-provider" });
      const augmented = augmentSchema(schema, registry);

      const meta = getMetadata(augmented)
      
      // Verify created timestamp exists
      expect(meta.created).toBeDefined()
      
      // Creator and publisher should be arrays (may be empty if no git/package.json)
      expect(Array.isArray(meta.creator)).toBe(true)
      expect(Array.isArray(meta.publisher)).toBe(true)
    })
  })

  describe("Real-world DataProvider scenario", () => {
    it("should augment multiple schemas independently", () => {
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

      // Augment each schema with its own registry entry
      registry.add(DataProviderPersonasSchema, { registry: "taxonomy", concept: "data-provider" });
      registry.add(DataProviderLifeCycleSchema, { registry: "taxonomy", concept: "data-provider" });
      
      const personasAugmented = augmentSchema(DataProviderPersonasSchema, registry);
      const lifeCycleAugmented = augmentSchema(DataProviderLifeCycleSchema, registry);

      const personasMeta = getMetadata(personasAugmented)
      const lifeCycleMeta = getMetadata(lifeCycleAugmented)

      // Verify the structure
      expect(personasMeta.uri).toBeDefined()
      expect(personasMeta.rank).toBe(2)
      
      expect(lifeCycleMeta.uri).toBeDefined()
      expect(lifeCycleMeta.rank).toBe(3)
      
      // Verify narrower relationships
      expect(personasMeta.narrower).toBeDefined()
      expect(personasMeta.narrower.length).toBeGreaterThan(0)
    })
  })
})
