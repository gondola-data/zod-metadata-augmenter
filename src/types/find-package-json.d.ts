interface FindPackageJsonResult {
  readonly value: Record<string, unknown> | null;
  readonly filename: string | undefined;
  readonly done: boolean;
}

interface FindPackageJsonIterator {
  next(): FindPackageJsonResult;
  [Symbol.iterator](): FindPackageJsonIterator;
}

declare module "find-package-json" {
  function findPackageJson(startPath?: string): FindPackageJsonIterator;
  export default findPackageJson;
}
