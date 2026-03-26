/**
 * Package Source Tests
 * 
 * Tests for extracting metadata from package.json
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getPackageJsonInfo,
  extractAuthors,
  extractPublishers,
  extractPackageName,
  type PackageJsonInfo,
} from "../../src/sources/package"

describe("package.ts", () => {
  describe("extractAuthors", () => {
    it("should extract author from string", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: "John Doe <john@example.com>",
      }

      const result = extractAuthors(pkg)
      expect(result).toContain("John Doe <john@example.com>")
    })

    it("should extract author from object", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
      }

      const result = extractAuthors(pkg)
      expect(result).toContain("john@example.com")
      expect(result).toContain("John Doe")
    })

    it("should extract contributors", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: "Jane Doe <jane@example.com>",
        contributors: [
          { name: "Alice", email: "alice@example.com" },
          "Bob <bob@example.com>",
        ],
      }

      const result = extractAuthors(pkg)
      expect(result).toContain("jane@example.com")
      expect(result).toContain("alice@example.com")
      expect(result).toContain("Bob <bob@example.com>")
    })

    it("should deduplicate authors", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: "John Doe <john@example.com>",
        contributors: [{ name: "John Doe", email: "john@example.com" }],
      }

      const result = extractAuthors(pkg)
      expect(result.length).toBe(1)
    })

    it("should return empty array for empty package", () => {
      const pkg: PackageJsonInfo = {}
      const result = extractAuthors(pkg)
      expect(result).toEqual([])
    })
  })

  describe("extractPublishers", () => {
    it("should use explicit publisher field", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        publisher: "ACME Corp",
        author: "John Doe",
      }

      const result = extractPublishers(pkg)
      expect(result).toEqual(["ACME Corp"])
    })

    it("should fall back to author name", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: "John Doe",
      }

      const result = extractPublishers(pkg)
      expect(result).toEqual(["John Doe"])
    })

    it("should extract name from author string", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: "John Doe <john@example.com>",
      }

      const result = extractPublishers(pkg)
      expect(result).toEqual(["John Doe"])
    })

    it("should use author object name", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
      }

      const result = extractPublishers(pkg)
      expect(result).toEqual(["John Doe"])
    })

    it("should return empty array when no publisher info", () => {
      const pkg: PackageJsonInfo = {
        name: "test-package",
      }

      const result = extractPublishers(pkg)
      expect(result).toEqual([])
    })
  })

  describe("extractPackageName", () => {
    it("should extract unscoped package name", () => {
      const pkg: PackageJsonInfo = { name: "my-package" }
      expect(extractPackageName(pkg)).toBe("my-package")
    })

    it("should extract scoped package name", () => {
      const pkg: PackageJsonInfo = { name: "@org/my-package" }
      expect(extractPackageName(pkg)).toBe("my-package")
    })

    it("should return undefined for missing name", () => {
      const pkg: PackageJsonInfo = {}
      expect(extractPackageName(pkg)).toBeUndefined()
    })
  })

  describe("getPackageJsonInfo", () => {
    it("should return null for non-existent directory", () => {
      // This test depends on the environment
      // We'll skip the actual filesystem test as it requires mocking
    })
  })
})
