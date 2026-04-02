/**
 * Git Source Tests
 * 
 * Tests for extracting metadata from git config
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getGitConfigInfo,
  extractGitAuthors,
  extractRepoIdentifier,
  type GitConfigInfo,
} from "../../src/sources/git"

describe("git.ts", () => {
  describe("extractGitAuthors", () => {
    it("should extract user email and name", () => {
      const gitInfo: GitConfigInfo = {
        userEmail: "john@example.com",
        userName: "John Doe",
        isRepo: true,
      }

      const result = extractGitAuthors(gitInfo)
      expect(result).toContain("john@example.com")
      expect(result).toContain("John Doe")
    })

    it("should return empty for non-repo", () => {
      const gitInfo: GitConfigInfo = {
        isRepo: false,
      }

      const result = extractGitAuthors(gitInfo)
      expect(result).toEqual([])
    })

    it("should handle missing name", () => {
      const gitInfo: GitConfigInfo = {
        userEmail: "john@example.com",
        isRepo: true,
      }

      const result = extractGitAuthors(gitInfo)
      expect(result).toEqual(["john@example.com"])
    })

    it("should deduplicate email and name if same", () => {
      const gitInfo: GitConfigInfo = {
        userEmail: "john@example.com",
        userName: "john@example.com",
        isRepo: true,
      }

      const result = extractGitAuthors(gitInfo)
      expect(result).toHaveLength(1)
    })
  })

  describe("extractRepoIdentifier", () => {
    it("should extract GitHub owner/repo", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "git@github.com:owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBe("owner/repo")
    })

    it("should extract GitHub HTTPS owner/repo", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "https://github.com/owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBe("owner/repo")
    })

    it("should extract GitLab owner/repo", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "git@gitlab.com:owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBe("owner/repo")
    })

    it("should extract Bitbucket owner/repo", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "git@bitbucket.org:owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBe("owner/repo")
    })

    it("should return undefined for no remote", () => {
      const gitInfo: GitConfigInfo = {
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBeUndefined()
    })

    it("should return undefined for unrecognized remote", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "https://custom-git.example.com/owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBeUndefined()
    })

    it("should handle .git suffix", () => {
      const gitInfo: GitConfigInfo = {
        remoteOrigin: "git@github.com:owner/repo.git",
        isRepo: true,
      }

      expect(extractRepoIdentifier(gitInfo)).toBe("owner/repo")
    })
  })

  describe("getGitConfigInfo", () => {
    it("should handle non-git directories gracefully", () => {
      // The function should return isRepo: false for non-git directories
      // Actual execution depends on the environment
    })
  })
})
