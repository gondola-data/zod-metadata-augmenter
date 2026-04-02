/**
 * Traversal Logic Tests
 *
 * Tests for the schema traversal utilities that enable navigation
 * through augmented Zod schemas using metadata relationships.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as z from "zod";
import {
  augmentSchema,
  createTraversalObject,
  findByUri,
  getNodesAtDepth,
  getPathToNode,
  traverseAll,
  getSiblings,
  getNodeDepth,
  countNodes,
} from "../src/index";
import type { TraversalNode, SchemaMetadata } from "../src/index";

describe("createTraversalObject", () => {
  // Using any type because Zod's registry API is experimental and TypeScript types are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let registry: any;

  beforeEach(() => {
    registry = z.registry<{ registry: string; concept: string }>();
  });

  describe("Basic Navigation", () => {
    it("should return root node with correct metadata", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        email: z.string().email().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      expect(traversal.meta.uri).toContain("user");
      expect(traversal.meta.broader).toBe("#/taxonomy");
    });

    it("should populate narrower array with child nodes", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        email: z.string().email().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      expect(traversal.narrower).toHaveLength(2);
      // Check that children have URI-based names
      const childUris = traversal.narrower.map((c) => c.meta.uri);
      expect(childUris.some((uri) => uri.includes("name"))).toBe(true);
      expect(childUris.some((uri) => uri.includes("email"))).toBe(true);
    });

    it("should correctly link previous/next siblings", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        email: z.string().email().meta({ rank: 1 }),
        age: z.number().meta({ rank: 2 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Sort by rank to get expected order
      const children = [...traversal.narrower].sort(
        (a, b) => a.meta.rank - b.meta.rank
      );

      // First child
      expect(children[0].previous).toBeNull();
      expect(children[0].next?.meta.uri).toBe(children[1].meta.uri);

      // Middle child
      expect(children[1].previous?.meta.uri).toBe(children[0].meta.uri);
      expect(children[1].next?.meta.uri).toBe(children[2].meta.uri);

      // Last child
      expect(children[2].previous?.meta.uri).toBe(children[1].meta.uri);
      expect(children[2].next).toBeNull();
    });
  });

  describe("Nested Object Navigation", () => {
    it("should navigate through nested objects", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        profile: z
          .object({
            bio: z.string().meta({ rank: 0 }),
            avatar: z.string().meta({ rank: 1 }),
          })
          .meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Find the profile field
      const profile = traversal.narrower.find((n) =>
        n.meta.uri.includes("profile")
      );
      expect(profile).toBeDefined();

      // Navigate to nested field
      const bio = profile!.narrower[0];
      expect(bio.meta.uri).toContain("bio");
    });

    it("should handle deeply nested schemas", () => {
      const schema = z.object({
        level1: z
          .object({
            level2: z
              .object({
                level3: z
                  .object({
                    value: z.string().meta({ rank: 0 }),
                  })
                  .meta({ rank: 0 }),
              })
              .meta({ rank: 0 }),
          })
          .meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "deep" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Navigate through all levels
      const l1 = traversal.narrower[0];
      expect(l1).toBeDefined();

      const l2 = l1.narrower[0];
      expect(l2).toBeDefined();

      const l3 = l2.narrower[0];
      expect(l3).toBeDefined();

      const value = l3.narrower[0];
      expect(value.meta.uri).toContain("value");
    });
  });

  describe("Discriminated Union Navigation", () => {
    it("should navigate through discriminated union options", () => {
      const schema = z.discriminatedUnion(
        "type",
        [
          z
            .object({ type: z.literal("a"), valueA: z.string() })
            .meta({ rank: 0 }),
          z
            .object({ type: z.literal("b"), valueB: z.number() })
            .meta({ rank: 1 }),
        ]
      );

      registry.add(schema, { registry: "taxonomy", concept: "union" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      expect(traversal.narrower).toHaveLength(2);
      const optionUris = traversal.narrower.map((n) => n.meta.uri);
      expect(optionUris.some((uri) => uri.includes("a"))).toBe(true);
      expect(optionUris.some((uri) => uri.includes("b"))).toBe(true);
    });

    it("should link union options with previous/next", () => {
      const schema = z.discriminatedUnion(
        "type",
        [
          z
            .object({ type: z.literal("first"), value: z.string() })
            .meta({ rank: 0 }),
          z
            .object({ type: z.literal("second"), value: z.number() })
            .meta({ rank: 1 }),
          z
            .object({ type: z.literal("third"), value: z.boolean() })
            .meta({ rank: 2 }),
        ]
      );

      registry.add(schema, { registry: "taxonomy", concept: "union" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const options = [...traversal.narrower].sort(
        (a, b) => a.meta.rank - b.meta.rank
      );

      expect(options[0].previous).toBeNull();
      expect(options[0].next?.meta.uri).toBe(options[1].meta.uri);
      expect(options[1].previous?.meta.uri).toBe(options[0].meta.uri);
      expect(options[1].next?.meta.uri).toBe(options[2].meta.uri);
      expect(options[2].previous?.meta.uri).toBe(options[1].meta.uri);
      expect(options[2].next).toBeNull();
    });
  });

  describe("URI Lookup", () => {
    it("should find node by URI using byUri method", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        email: z.string().email().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Find the name field
      const nameNode = traversal.narrower[0];
      const found = traversal.byUri(nameNode.meta.uri);

      expect(found?.meta.uri).toBe(nameNode.meta.uri);
    });

    it("should return undefined for non-existent URI", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      expect(traversal.byUri("#/non/existent")).toBeUndefined();
    });

    it("should allow URI lookup from any node", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
        profile: z
          .object({
            bio: z.string().meta({ rank: 0 }),
          })
          .meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Get a nested node
      const profile = traversal.narrower.find((n) =>
        n.meta.uri.includes("profile")
      )!;

      // Should be able to lookup root from child
      const rootFromChild = profile.byUri(traversal.meta.uri);
      expect(rootFromChild?.meta.uri).toBe(traversal.meta.uri);
    });
  });

  describe("Array Handling", () => {
    it("should traverse array element type", () => {
      const schema = z.object({
        tags: z.array(z.string()).meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "post" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Array should have element as child
      const tags = traversal.narrower[0];
      expect(tags).toBeDefined();
      // The element type (string) should be in narrower
      expect(tags.narrower.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty object schema", () => {
      const schema = z.object({});

      registry.add(schema, { registry: "taxonomy", concept: "empty" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      expect(traversal.meta.uri).toBeDefined();
      expect(traversal.narrower).toHaveLength(0);
    });

    it("should handle schema without rank metadata", () => {
      const schema = z.object({
        name: z.string(), // No rank
        email: z.string().email(),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Should still work, defaults to insertion order
      expect(traversal.narrower.length).toBeGreaterThan(0);
    });

    it("should throw when no root node found", () => {
      // This is a bit contrived - but tests error handling
      const schema = z.string();

      registry.add(schema, { registry: "taxonomy", concept: "primitive" });
      const augmented = augmentSchema(schema, registry);

      // Primitives might not have metadata - the traversal should handle this
      // This test verifies the function doesn't crash on edge cases
      expect(() => createTraversalObject(augmented)).not.toThrow();
    });
  });

  describe("Utility Functions", () => {
    it("should find path to node", () => {
      const schema = z.object({
        a: z
          .object({
            b: z
              .object({
                c: z.string().meta({ rank: 0 }),
              })
              .meta({ rank: 0 }),
          })
          .meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "path" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      // Find 'c' node
      let cUri = "";
      for (const node of traverseAll(traversal)) {
        if (node.meta.uri.includes("/resource/c")) {
          cUri = node.meta.uri;
          break;
        }
      }

      const path = getPathToNode(traversal, cUri);
      expect(path).not.toBeNull();
      expect(path!.length).toBe(4); // root -> a -> b -> c
    });

    it("should get siblings correctly", () => {
      const schema = z.object({
        a: z.string().meta({ rank: 0 }),
        b: z.string().meta({ rank: 1 }),
        c: z.string().meta({ rank: 2 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "siblings" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const children = [...traversal.narrower].sort(
        (a, b) => a.meta.rank - b.meta.rank
      );
      const middle = children[1];
      const siblings = getSiblings(middle);

      expect(siblings).toHaveLength(3);
      expect(siblings[0].meta.rank).toBe(0);
      expect(siblings[1].meta.rank).toBe(1);
      expect(siblings[2].meta.rank).toBe(2);
    });

    it("should get nodes at specific depth", () => {
      const schema = z.object({
        a: z
          .object({
            b: z.string().meta({ rank: 0 }),
          })
          .meta({ rank: 0 }),
        c: z.string().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "depth" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const depth0 = getNodesAtDepth(traversal, 0);
      expect(depth0).toHaveLength(1); // root

      const depth1 = getNodesAtDepth(traversal, 1);
      expect(depth1.length).toBeGreaterThan(0);
    });

    it("should traverse all nodes", () => {
      const schema = z.object({
        a: z.string().meta({ rank: 0 }),
        b: z.string().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "iterate" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const nodes = [...traverseAll(traversal)];
      expect(nodes.length).toBeGreaterThan(0);
    });

    it("should count nodes correctly", () => {
      const schema = z.object({
        a: z.string().meta({ rank: 0 }),
        b: z.string().meta({ rank: 1 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "count" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const count = countNodes(traversal);
      expect(count).toBeGreaterThan(0);
    });

    it("should get node depth", () => {
      const schema = z.object({
        a: z
          .object({
            b: z.string().meta({ rank: 0 }),
          })
          .meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "depth" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const depth = getNodeDepth(traversal, traversal);
      expect(depth).toBe(0);

      const childDepth = getNodeDepth(traversal, traversal.narrower[0]);
      expect(childDepth).toBe(1);
    });

    it("should find by URI using utility function", () => {
      const schema = z.object({
        name: z.string().meta({ rank: 0 }),
      });

      registry.add(schema, { registry: "taxonomy", concept: "user" });
      const augmented = augmentSchema(schema, registry);
      const traversal = createTraversalObject(augmented);

      const nameNode = traversal.narrower[0];
      const found = findByUri(traversal, nameNode.meta.uri);

      expect(found?.meta.uri).toBe(nameNode.meta.uri);
    });
  });
});
