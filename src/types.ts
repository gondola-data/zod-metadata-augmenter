/**
 * Types for Zod Schema Metadata Augmentation
 *
 * This module provides types for attaching SKOS-inspired metadata to Zod schemas,
 * with support for automatic population from industry-standard sources.
 *
 * ## SKOS Vocabulary Inspiration
 *
 * The metadata schema is inspired by SKOS (Simple Knowledge Organization System):
 * - https://www.w3.org/2004/02/skos/core#
 *
 * SKOS concepts have these relationships:
 * - `broader`: Points to a more general concept (parent)
 * - `narrower`: Points to more specific concepts (children)
 * - `previous/next`: Sequential ordering (for ordinal concepts)
 *
 * Our implementation adapts these for Zod schema hierarchies:
 * - Objects become "resources" or "items" depending on depth
 * - Discriminated unions become collections of related options
 * - Field order is preserved via `rank`
 *
 * ## Source Auto-Population
 *
 * Metadata fields like `creator` and `publisher` are automatically populated from:
 * - Git config (`user.email`, `user.name`)
 * - Package.json (`author`, `publisher`)
 *
 * The augmentation process merges user-provided metadata with auto-computed values.
 * User-provided values (like `rank`) are preserved.
 */

import type * as z from "zod";

/**
 * Core metadata interface for schema concepts
 * Based on SKOS (Simple Knowledge Organization System) vocabulary
 */
export interface SchemaMetadata {
  /**
   * Unique identifier for this concept/item in the taxonomy
   * Format: #/taxonomy/concept/{domain}/{concept}[/item/{item}]
   */
  uri: string;

  /**
   * Broader concept URI (parent in hierarchy)
   * SKOS: broader
   */
  broader: string | null;

  /**
   * Narrower concept URIs (children in hierarchy)
   * SKOS: narrower
   */
  narrower: string[];

  /**
   * Previous concept URI in ordered sequence
   * Used for navigation between siblings
   */
  previous: string | null;

  /**
   * Next concept URI in ordered sequence
   * Used for navigation between siblings
   */
  next: string | null;

  /**
   * Creation timestamp (ISO 8601)
   * Auto-populated at augmentation time
   */
  created: string;

  /**
   * Creators of this schema concept
   * Auto-populated from git config or package.json
   */
  creator: string[];

  /**
   * Publisher of this schema
   * Auto-populated from package.json
   */
  publisher: string[];

  /**
   * Ordinal position for sorting
   * User-provided - represents semantic ordering that cannot be inferred
   */
  rank: number;
}

/**
 * Field-level metadata for individual schema properties
 */
export interface FieldMetadata {
  /**
   * URI for this specific field/resource
   * Format: #/taxonomy/concept/{domain}/{concept}/resource/{field}
   */
  uri: string;

  /**
   * Ordinal position of the field within its parent schema
   * User-provided - represents semantic field ordering
   */
  rank: number;
}

/**
 * Source information retrieved from external sources
 */
export interface SourceInfo {
  /** Git author email */
  gitAuthor?: string;
  /** Git committer email */
  gitCommitter?: string;
  /** Package author from package.json */
  packageAuthor?: string;
  /** Package publisher from package.json */
  packagePublisher?: string;
  /** Package name */
  packageName?: string;
  /** Package version */
  packageVersion?: string;
}

/**
 * Discriminated union member info for inferring relationships
 */
export interface UnionMemberInfo {
  /** The name of the schema */
  name: string;
  /** The actual schema */
  schema: z.ZodTypeAny;
  /** Index in the union */
  index: number;
}
