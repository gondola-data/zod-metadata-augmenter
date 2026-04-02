/**
 * Git Configuration Source
 * 
 * Extracts metadata from git config following Git conventions
 * for identifying authors and committers.
 */

import { execSync } from "child_process"
import { cwd } from "process"

export interface GitConfigInfo {
  /** Git user.email from config */
  userEmail?: string
  /** Git user.name from config */
  userName?: string
  /** Current branch name */
  branch?: string
  /** Git remote origin URL */
  remoteOrigin?: string
  /** Whether this is a git repository */
  isRepo: boolean
}

/**
 * Execute a git command safely
 * Returns null if not in a git repo or command fails
 */
function gitExec(args: string[], cwdPath?: string): string | null {
  try {
    const result = execSync(`git ${args.join(" ")}`, {
      cwd: cwdPath || cwd(),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    })
    return result.trim()
  } catch {
    return null
  }
}

/**
 * Check if current directory is a git repository
 */
function isGitRepo(cwdPath?: string): boolean {
  return gitExec(["rev-parse", "--git-dir"], cwdPath) !== null
}

/**
 * Get git configuration from the local repository
 * 
 * @param cwdPath - Working directory to check (default: process.cwd())
 * @returns GitConfigInfo object
 */
export function getGitConfigInfo(cwdPath?: string): GitConfigInfo {
  const info: GitConfigInfo = {
    isRepo: isGitRepo(cwdPath),
  }
  
  if (!info.isRepo) {
    return info
  }
  
  // Get user email
  const email = gitExec(["config", "user.email"], cwdPath)
  if (email) {
    info.userEmail = email
  }
  
  // Get user name
  const name = gitExec(["config", "user.name"], cwdPath)
  if (name) {
    info.userName = name
  }
  
  // Get current branch
  const branch = gitExec(["rev-parse", "--abbrev-ref", "HEAD"], cwdPath)
  if (branch) {
    info.branch = branch
  }
  
  // Get remote origin
  const remote = gitExec(["config", "remote.origin.url"], cwdPath)
  if (remote) {
    info.remoteOrigin = remote
  }
  
  return info
}

/**
 * Extract author from git config
 * Prefers user email, falls back to user name
 * 
 * @param gitInfo - GitConfigInfo
 * @returns Array of author strings
 */
export function extractGitAuthors(gitInfo: GitConfigInfo): string[] {
  const authors: string[] = []
  
  if (gitInfo.userEmail) {
    authors.push(gitInfo.userEmail)
  }
  
  if (gitInfo.userName && !authors.includes(gitInfo.userName)) {
    authors.push(gitInfo.userName)
  }
  
  return authors
}

/**
 * Get the repository identifier from git remote
 * Extracts owner/repo format from common git hosting URLs
 * 
 * @param gitInfo - GitConfigInfo
 * @returns Repository identifier or undefined
 */
export function extractRepoIdentifier(gitInfo: GitConfigInfo): string | undefined {
  if (!gitInfo.remoteOrigin) return undefined
  
  // GitHub: git@github.com:owner/repo.git or https://github.com/owner/repo.git
  const githubMatch = gitInfo.remoteOrigin.match(/(?:github\.com[/:])([^/]+)\/([^/.]+)(?:\.git)?/)
  if (githubMatch) {
    return `${githubMatch[1]}/${githubMatch[2]}`
  }
  
  // GitLab: git@gitlab.com:owner/repo.git
  const gitlabMatch = gitInfo.remoteOrigin.match(/(?:gitlab\.com[/:])([^/]+)\/([^/.]+)(?:\.git)?/)
  if (gitlabMatch) {
    return `${gitlabMatch[1]}/${gitlabMatch[2]}`
  }
  
  // Bitbucket: git@bitbucket.org:owner/repo.git
  const bitbucketMatch = gitInfo.remoteOrigin.match(/(?:bitbucket\.org[/:])([^/]+)\/([^/.]+)(?:\.git)?/)
  if (bitbucketMatch) {
    return `${bitbucketMatch[1]}/${bitbucketMatch[2]}`
  }
  
  return undefined
}
