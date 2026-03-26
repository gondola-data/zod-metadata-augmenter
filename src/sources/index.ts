/**
 * Metadata Sources
 *
 * Unified interface for extracting metadata from various industry-standard sources.
 *
 * This module provides functions to automatically populate metadata fields like
 * `creator` and `publisher` from sources that are typically already present in
 * a project's development environment.
 *
 * ## Supported Sources
 *
 * ### package.json (npm/pnpm conventions)
 * - `author`: Used for creator and publisher if available
 * - `contributors`: Additional creators
 * - `publisher`: Explicit publisher field
 *
 * ### Git Configuration
 * - `user.email`: Primary creator identifier
 * - `user.name`: Fallback creator identifier
 *
 * ## Priority Order
 *
 * When multiple sources provide the same information, the following precedence applies:
 *
 * **Creator:**
 * 1. Explicit option (if provided)
 * 2. Git user.email
 * 3. Git user.name
 * 4. Package.json author
 *
 * **Publisher:**
 * 1. Explicit option (if provided)
 * 2. Package.json publisher field
 * 3. Package.json author name
 *
 * ## Usage
 *
 * ```typescript
 * import { getSourceInfo, getCreators, getPublishers } from "./sources"
 *
 * // Get all source info at once
 * const info = getSourceInfo()
 * console.log(info.gitAuthor)   // e.g., "user@example.com"
 * console.log(info.publisher)   // e.g., "My Company"
 *
 * // Get creators with fallback logic
 * const creators = getCreators()
 * // Returns: [git email] or [package author] or []
 *
 * // Get publishers with fallback logic
 * const publishers = getPublishers()
 * // Returns: [package publisher] or [author name] or []
 * ```
 */

export {
  getPackageJsonInfo,
  extractAuthors,
  extractPublishers,
  extractPackageName,
  type PackageJsonInfo,
} from "./package";

export {
  getGitConfigInfo,
  extractGitAuthors,
  extractRepoIdentifier,
  type GitConfigInfo,
} from "./git";

import {
  getPackageJsonInfo,
  extractAuthors,
  extractPublishers,
} from "./package";
import { getGitConfigInfo, extractGitAuthors } from "./git";
import type { SourceInfo } from "../types";

/**
 * Combined source information from all available sources
 *
 * @param cwdPath - Working directory to search from
 * @returns Merged SourceInfo from all sources
 */
export function getSourceInfo(cwdPath?: string): SourceInfo {
  // Get package.json info
  const pkg = getPackageJsonInfo(cwdPath);

  // Get git config info
  const git = getGitConfigInfo(cwdPath);

  // Combine authors (git takes precedence, then package.json)
  const gitAuthors = extractGitAuthors(git);
  const packageAuthors = pkg ? extractAuthors(pkg) : [];
  const allAuthors = [
    ...gitAuthors,
    ...packageAuthors.filter((a) => !gitAuthors.includes(a)),
  ] as string[];

  // Get publishers (prefer package.json)
  const packagePublishers = pkg ? extractPublishers(pkg) : [];

  return {
    gitAuthor: git.userEmail || git.userName,
    gitCommitter: git.userEmail,
    packageAuthor: packageAuthors[0],
    packagePublisher: packagePublishers[0],
    packageName: pkg?.name,
    packageVersion: pkg?.version,
  };
}

/**
 * Get creator array with fallback
 * Priority: explicit option > git > package.json
 *
 * @param explicitCreator - Optional explicit creator override
 * @param cwdPath - Working directory
 * @returns Array of creator strings
 */
export function getCreators(
  explicitCreator?: string[],
  cwdPath?: string,
): string[] {
  if (explicitCreator && explicitCreator.length > 0) {
    return explicitCreator;
  }

  const gitAuthors = extractGitAuthors(getGitConfigInfo(cwdPath));
  if (gitAuthors.length > 0) {
    return gitAuthors;
  }

  const pkg = getPackageJsonInfo(cwdPath);
  if (pkg) {
    return extractAuthors(pkg);
  }

  return [];
}

/**
 * Get publisher array with fallback
 * Priority: explicit option > package.json
 *
 * @param explicitPublisher - Optional explicit publisher override
 * @param cwdPath - Working directory
 * @returns Array of publisher strings
 */
export function getPublishers(
  explicitPublisher?: string[],
  cwdPath?: string,
): string[] {
  if (explicitPublisher && explicitPublisher.length > 0) {
    return explicitPublisher;
  }

  const pkg = getPackageJsonInfo(cwdPath);
  if (pkg) {
    return extractPublishers(pkg);
  }

  return [];
}
