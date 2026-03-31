/**
 * Traversal Demo
 *
 * Demonstrates practical use cases for the Zod Schema Traversal feature.
 * This walks through the DataProvider schema to show how to navigate,
 * search, and analyze augmented Zod schemas.
 *
 * Usage:
 *   npx tsx example/traversal-demo.ts
 */

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
  type TraversalNode,
} from "../src/index.cli";
import { DataProviderSchema } from "./schema";
import { DATA_PROVIDER_TYPES } from "./types/data-provider";

// ============================================================================
// SETUP
// ============================================================================

// Create Registry (same as build-schema.ts)
const TaxonomyRegistry = z.registry<{ registry: string; concept: string }>();

// Add schema to the registry
TaxonomyRegistry.add(DataProviderSchema as any, {
  registry: "taxonomy",
  concept: "data-provider",
});

// Augment and create traversal
const augmented = augmentSchema(DataProviderSchema, TaxonomyRegistry);
const traversal = createTraversalObject(augmented);

// ============================================================================
// USE CASE 1: SCHEMA ANALYZER
// ============================================================================

function runSchemaAnalyzer(traversal: TraversalNode) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SCHEMA ANALYZER");
  console.log("=".repeat(60));

  // Count total nodes
  const total = countNodes(traversal);
  console.log(`\n📈 Total nodes in schema: ${total}`);

  // Depth distribution
  console.log("\n📊 Depth Distribution:");
  const maxDepth = 5;
  for (let d = 0; d <= maxDepth; d++) {
    const nodes = getNodesAtDepth(traversal, d);
    if (nodes.length > 0) {
      console.log(`  Depth ${d}: ${nodes.length} nodes`);
    }
  }

  // Find all discriminator options
  console.log("\n🔀 Discriminator Options:");

  // Find authentication discriminator - check schema.type === 'union'
  const authNode = traversal.narrower.find(
    (n) => n.schema.type === "union" && n.meta.uri?.includes("authentication")
  );
  
  if (authNode) {
    console.log("\n  Authentication Options (9 types):");
    // Union options are in narrower
    const sortedOptions = [...authNode.narrower].sort(
      (a, b) => (a.meta.rank ?? 0) - (b.meta.rank ?? 0)
    );
    for (const option of sortedOptions) {
      const name = option.meta.uri?.split("/item/").pop() ?? "unknown";
      console.log(`    • ${name}`);
    }
  }

  // Find connection discriminator
  const connNode = traversal.narrower.find(
    (n) => n.schema.type === "union" && n.meta.uri?.includes("connection")
  );
  
  if (connNode) {
    console.log("\n  Connection Options (9 types):");
    const sortedOptions = [...connNode.narrower].sort(
      (a, b) => (a.meta.rank ?? 0) - (b.meta.rank ?? 0)
    );
    for (const option of sortedOptions) {
      const name = option.meta.uri?.split("/item/").pop() ?? "unknown";
      console.log(`    • ${name}`);
    }
  }

  // List all data provider types
  console.log("\n📋 Supported Data Provider Types:");
  for (const type of DATA_PROVIDER_TYPES) {
    console.log(`    • ${type}`);
  }
}

// ============================================================================
// USE CASE 2: DOCUMENTATION GENERATOR
// ============================================================================

function runDocumentationGenerator(traversal: TraversalNode) {
  console.log("\n" + "=".repeat(60));
  console.log("📖 DOCUMENTATION GENERATOR");
  console.log("=".repeat(60));

  // Generate tree structure (limited depth for readability)
  function generateTree(
    node: TraversalNode,
    indent: string = "",
    maxDepth: number = 2,
    currentDepth: number = 0
  ): void {
    if (currentDepth >= maxDepth) {
      if (node.narrower.length > 0) {
        const name = node.meta.uri?.split("/").pop() ?? "root";
        console.log(`${indent}└── ${name} (${node.narrower.length} children...)`);
      }
      return;
    }

    const name = node.meta.uri?.split("/").pop() ?? "root";
    const rank = node.meta.rank ?? "-";

    // Get field type from schema
    let typeStr = node.schema.type ?? "unknown";
    if (node.schema.type === "union") {
      typeStr = `union(${node.narrower.length} options)`;
    } else if (node.schema.type === "array") {
      typeStr = "array";
    } else if (node.schema.type === "object") {
      typeStr = "object";
    }

    console.log(
      `${indent}├── ${name} (${typeStr}) [rank: ${rank}]`
    );

    // Process children
    const children = node.narrower;
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      const childIndent = indent + (isLast ? "    " : "│   ");
      generateTree(children[i], childIndent, maxDepth, currentDepth + 1);
    }
  }

  console.log("\n📄 Schema Tree Structure (truncated):");
  generateTree(traversal);

  // Generate field documentation table
  console.log("\n📋 Top-Level Fields:");
  console.log("  Field Name          | Type                   | Required | Rank");
  console.log("  " + "-".repeat(60));

  for (const field of traversal.narrower) {
    const name = (field.meta.uri?.split("/").pop() ?? "").padEnd(20);
    const type = (field.schema.type ?? "unknown").padEnd(23);
    const isOptional = field.schema.isOptional() ? "No" : "Yes";
    const rank = String(field.meta.rank ?? "-").padEnd(4);
    console.log(`  ${name} | ${type} | ${isOptional.padEnd(8)} | ${rank}`);
  }
}

// ============================================================================
// USE CASE 3: FIELD SEARCH & LOOKUP
// ============================================================================

function runFieldSearch(traversal: TraversalNode) {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 FIELD SEARCH & LOOKUP");
  console.log("=".repeat(60));

  // Helper to find node containing text
  function findNodeContaining(
    traversal: TraversalNode,
    searchTerm: string
  ): TraversalNode | undefined {
    for (const node of traverseAll(traversal)) {
      if (node.meta.uri?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return node;
      }
    }
    return undefined;
  }

  // Example 1: Find host field in Database authentication
  console.log("\n1️⃣  Find 'host' field in Database authentication:");
  const hostNode = findNodeContaining(traversal, "host");

  if (hostNode) {
    console.log(`   Found: ${hostNode.meta.uri}`);
    console.log(`   Type: ${hostNode.schema.type}`);
    console.log(`   Rank: ${hostNode.meta.rank}`);
  } else {
    console.log("   Not found");
  }

  // Example 2: Find all enum fields
  console.log("\n2️⃣  Find all ENUM fields in schema:");
  const enumFields: TraversalNode[] = [];
  for (const node of traverseAll(traversal)) {
    // Check schema.type === 'enum'
    if (node.schema.type === "enum") {
      enumFields.push(node);
    }
  }

  console.log(`   Found ${enumFields.length} enum fields:`);
  for (const field of enumFields.slice(0, 10)) {
    const name = field.meta.uri?.split("/").pop() ?? "unknown";
    console.log(`   • ${name}`);
  }
  if (enumFields.length > 10) {
    console.log(`   ... and ${enumFields.length - 10} more`);
  }

  // Example 3: Find all required fields (non-optional)
  console.log("\n3️⃣  Find all REQUIRED (non-optional) fields:");
  const requiredFields: TraversalNode[] = [];
  for (const node of traverseAll(traversal)) {
    if (!node.schema.isOptional() && node.meta.uri) {
      requiredFields.push(node);
    }
  }

  console.log(`   Found ${requiredFields.length} required fields`);
  const sampleRequired = requiredFields.slice(0, 8);
  for (const field of sampleRequired) {
    const name = field.meta.uri?.split("/").pop() ?? "unknown";
    console.log(`   • ${name}`);
  }
  if (requiredFields.length > 8) {
    console.log(`   ... and ${requiredFields.length - 8} more`);
  }
}

// ============================================================================
// USE CASE 4: DISCRIMINATOR NAVIGATION
// ============================================================================

function runDiscriminatorNavigation(traversal: TraversalNode) {
  console.log("\n" + "=".repeat(60));
  console.log("🔀 DISCRIMINATOR NAVIGATION");
  console.log("=".repeat(60));

  // Find authentication discriminator by type
  const authNode = traversal.narrower.find(
    (n) => n.schema.type === "union" && n.meta.uri?.includes("authentication")
  );

  if (!authNode) {
    console.log("\n❌ Authentication discriminator not found");
    return;
  }

  console.log("\n🔄 Walking through Authentication Options:");
  console.log("   (using previous/next sibling links)\n");

  // Get all options sorted by rank
  const sortedOptions = [...authNode.narrower].sort(
    (a, b) => (a.meta.rank ?? 0) - (b.meta.rank ?? 0)
  );

  // Find the first option (no previous link)
  let current = sortedOptions.find((n) => n.previous === null);

  // Traverse forward using next links
  let step = 0;
  while (current) {
    const name = current.meta.uri?.split("/item/").pop() ?? 
                 current.meta.uri?.split("/").pop() ?? "unknown";
    const hasNext = current.next !== null;

    console.log(`   ${step + 1}. ${name} ${hasNext ? "→" : ""}`);

    if (!current.next) break;

    // Find next node
    current = sortedOptions.find(
      (n) => n.meta.uri === current?.next?.meta.uri
    );
    step++;

    if (step > 20) {
      console.log("   ⚠️  Safety limit reached");
      break;
    }
  }

  // Demonstrate siblings utility
  console.log("\n📝 Using getSiblings() on Database auth option:");
  const dbAuth = authNode.narrower.find((n) =>
    n.meta.uri?.includes("database")
  );

  if (dbAuth) {
    const siblings = getSiblings(dbAuth);
    console.log(`   Database auth has ${siblings.length} siblings total`);
    console.log("   Sibling order:");
    for (const sib of siblings) {
      const sibName = sib.meta.uri?.split("/item/").pop() ?? 
                      sib.meta.uri?.split("/").pop() ?? "unknown";
      const marker = sib.meta.uri === dbAuth.meta.uri ? "👉" : "  ";
      console.log(`   ${marker} ${sibName}`);
    }
  }
}

// ============================================================================
// USE CASE 5: BREADCRUMB BUILDER
// ============================================================================

function runBreadcrumbBuilder(traversal: TraversalNode) {
  console.log("\n" + "=".repeat(60));
  console.log("🍞 BREADCRUMB BUILDER");
  console.log("=".repeat(60));

  // Helper to find any node containing a string
  function findNodeContaining(
    traversal: TraversalNode,
    searchTerm: string
  ): TraversalNode | undefined {
    for (const node of traverseAll(traversal)) {
      if (node.meta.uri?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return node;
      }
    }
    return undefined;
  }

  // Example 1: Path to a nested field
  console.log("\n1️⃣  Path to 'host' in Database authentication:");
  const hostNode = findNodeContaining(traversal, "host");

  if (hostNode) {
    const path = getPathToNode(traversal, hostNode.meta.uri);
    if (path) {
      console.log(`   Depth: ${path.length - 1}`);
      console.log("   Breadcrumb:");
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        const name = node.meta.uri?.split("/").pop() ?? "root";
        const indent = "   " + "  ".repeat(i);
        const isLast = i === path.length - 1;
        console.log(`${indent}${isLast ? "👉" : "📁"} ${name}`);
      }
    }
  }

  // Example 2: Path to email in personas
  console.log("\n2️⃣  Path to 'email' in personas:");
  const personasNode = traversal.narrower.find(
    (n) => n.meta.uri?.includes("personas")
  );
  
  if (personasNode) {
    // Find email in nested items
    const emailNested = personasNode.narrower
      .flatMap((item) => item.narrower)
      .find((n) => n.meta.uri?.includes("email"));

    if (emailNested) {
      const emailPath = getPathToNode(traversal, emailNested.meta.uri);
      if (emailPath) {
        console.log(`   Depth: ${emailPath.length - 1}`);
        console.log("   Breadcrumb:");
        for (let i = 0; i < emailPath.length; i++) {
          const node = emailPath[i];
          const name = node.meta.uri?.split("/").pop() ?? "root";
          const indent = "   " + "  ".repeat(i);
          const isLast = i === emailPath.length - 1;
          console.log(`${indent}${isLast ? "👉" : "📁"} ${name}`);
        }
      }
    }
  }

  // Example 3: Show depth of various nodes
  console.log("\n3️⃣  Node depths:");
  const testNodes = [
    { name: "root", node: traversal },
    { name: "basic", node: traversal.narrower.find(n => n.meta.uri?.includes("basic")) },
    { name: "authentication", node: traversal.narrower.find(n => n.meta.uri?.includes("authentication")) },
    { name: "personas", node: traversal.narrower.find(n => n.meta.uri?.includes("personas")) },
  ];

  for (const { name, node } of testNodes) {
    if (node) {
      const depth = getNodeDepth(traversal, node);
      console.log(`   ${name}: depth ${depth}`);
    }
  }

  // Show deepest node
  console.log("\n4️⃣  Finding deepest node:");
  let deepestNode: TraversalNode | null = null;
  let maxDepth = 0;

  for (const node of traverseAll(traversal)) {
    const depth = getNodeDepth(traversal, node);
    if (depth > maxDepth) {
      maxDepth = depth;
      deepestNode = node;
    }
  }

  if (deepestNode) {
    const path = getPathToNode(traversal, deepestNode.meta.uri);
    console.log(`   Deepest node at depth ${maxDepth}:`);
    console.log(`   URI: ${deepestNode.meta.uri}`);
    if (path) {
      console.log("   Full path:");
      for (const node of path) {
        console.log(`     • ${node.meta.uri?.split("/").pop()}`);
      }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log("🚀 Zod Schema Augmenter - Traversal Demo");
  console.log("   Exploring the DataProvider schema\n");

  // Run all demonstrations
  runSchemaAnalyzer(traversal);
  runDocumentationGenerator(traversal);
  runFieldSearch(traversal);
  runDiscriminatorNavigation(traversal);
  runBreadcrumbBuilder(traversal);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Traversal Demo Complete!");
  console.log("=".repeat(60));
  console.log("\n💡 Try these API calls on the traversal object:");
  console.log("   traversal.narrower           // Get child nodes");
  console.log("   traversal.byUri(uri)         // O(1) URI lookup");
  console.log("   getPathToNode(root, uri)     // Get path to node");
  console.log("   getSiblings(node)            // Get sibling nodes");
  console.log("   countNodes(root)             // Count all nodes");
}

main();
