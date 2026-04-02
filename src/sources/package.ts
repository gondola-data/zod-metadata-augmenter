/**
 * Package.json Source
 * 
 * Extracts metadata from package.json following npm/pnpm conventions
 * and the Node.js package manager standard.
 */

import { readFileSync } from "fs"
import { join } from "path"
import findPackageJson from "find-package-json"

export interface PackageJsonInfo {
  name?: string
  version?: string
  author?: string | { name: string; email?: string; url?: string }
  publisher?: string
  contributors?: Array<
    | { name: string; email?: string; url?: string }
    | string
  >
}

/**
 * Find and parse the nearest package.json from a given directory
 * Follows Node.js module resolution (walks up from cwd)
 * 
 * @param startDir - Directory to start searching from (default: process.cwd())
 * @returns Parsed package.json contents or null if not found
 */
export function getPackageJsonInfo(startDir?: string): PackageJsonInfo | null {
  try {
    const finder = findPackageJson(startDir || process.cwd())
    const result = finder.next()
    
    if (result.value) {
      return result.value as PackageJsonInfo
    }
    
    return null
  } catch {
    // Try direct file read as fallback
    try {
      const packageJsonPath = join(startDir || process.cwd(), "package.json")
      const content = readFileSync(packageJsonPath, "utf-8")
      return JSON.parse(content) as PackageJsonInfo
    } catch {
      return null
    }
  }
}

/**
 * Extract author from package.json
 * Handles both string and object formats
 * 
 * @param pkg - PackageJsonInfo
 * @returns Array of author strings
 * 
 * Format:
 * - String author: returns the full string (e.g., "John Doe <john@example.com>")
 * - Object author: returns both name and email
 * - String contributor: returns the full string
 * - Object contributor: returns email only
 * 
 * Deduplication: Extracts emails from all entries and deduplicates by email
 */
export function extractAuthors(pkg: PackageJsonInfo): string[] {
  // Track emails for deduplication
  const seenEmails = new Set<string>()
  const result: string[] = []
  
  const addAuthor = (authorEntry: string) => {
    // Extract email from "Name <email>" format for deduplication
    const emailMatch = authorEntry.match(/<([^>]+)>/)
    const email = emailMatch ? emailMatch[1] : null
    
    // If we have an email, check if already seen (deduplication)
    if (email) {
      if (seenEmails.has(email)) {
        return // Already added, skip
      }
      seenEmails.add(email)
    }
    
    result.push(authorEntry)
  }
  
  // Handle author
  if (typeof pkg.author === "string") {
    addAuthor(pkg.author)
  } else if (pkg.author && typeof pkg.author === "object") {
    // Object author: add both name and email
    if (pkg.author.name) {
      addAuthor(pkg.author.name)
    }
    if (pkg.author.email) {
      addAuthor(pkg.author.email)
    }
  }
  
  // Handle contributors
  if (pkg.contributors) {
    for (const contributor of pkg.contributors) {
      if (typeof contributor === "string") {
        addAuthor(contributor)
      } else if (typeof contributor === "object") {
        // Object contributor: add email only
        if (contributor.email) {
          addAuthor(contributor.email)
        }
      }
    }
  }
  
  return result
}

/**
 * Extract publisher from package.json
 * Uses the npm/pnpm publisher field or falls back to author
 * 
 * @param pkg - PackageJsonInfo
 * @returns Array of publisher strings
 */
export function extractPublishers(pkg: PackageJsonInfo): string[] {
  // Use explicit publisher field first
  if (pkg.publisher) {
    return [pkg.publisher]
  }
  
  // Fall back to author
  if (pkg.author) {
    if (typeof pkg.author === "string") {
      // Try to extract name from string like "John Doe <john@example.com>"
      const match = pkg.author.match(/^([^<]+)/)
      if (match) {
        return [match[1].trim()]
      }
      return [pkg.author]
    }
    if (typeof pkg.author === "object" && pkg.author.name) {
      return [pkg.author.name]
    }
  }
  
  return []
}

/**
 * Extract package name in a normalized format
 * 
 * @param pkg - PackageJsonInfo
 * @returns Normalized package name or undefined
 */
export function extractPackageName(pkg: PackageJsonInfo): string | undefined {
  return pkg.name?.replace(/^@[\w-]+\//, "") // Remove scope if present
}
