import { promises as fs } from "node:fs";
import { join, resolve } from "node:path";
import { CodePattern, FileNode } from "../types.js";

interface AnalyzeOptions {
  maxEntries?: number;
  signal?: AbortSignal;
}

const DEFAULT_MAX_ENTRIES = 400;
const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", "dist", "build", ".next"]);

export class WorkspaceAnalyzer {
  async analyzeStructure(workspacePath: string, options: AnalyzeOptions = {}): Promise<FileNode[]> {
    const entries: FileNode[] = [];
    const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    await this.walk(workspacePath, entries, maxEntries, options.signal);
    return entries;
  }

  async analyzeCodePatterns(workspacePath: string, options: AnalyzeOptions = {}): Promise<CodePattern[]> {
    const structure = await this.analyzeStructure(workspacePath, options);
    const patterns: CodePattern[] = [];

    const addPattern = (identifier: string, predicate: (node: FileNode) => boolean) => {
      const matched = structure.filter(predicate).map((node) => node.path);
      if (matched.length) {
        patterns.push({ identifier, matchedPaths: matched });
      }
    };

    addPattern("react_component", (node) => /\.(tsx|jsx)$/.test(node.path));
    addPattern("next_app_directory", (node) => node.isDirectory && /(^|\\|\/)app$/.test(node.path));
    addPattern("next_pages_directory", (node) => node.isDirectory && /(^|\\|\/)pages$/.test(node.path));
    addPattern("api_routes", (node) => /api\/(.*)\.(ts|js)$/.test(node.path));

    return patterns;
  }

  private async walk(
    currentPath: string,
    entries: FileNode[],
    maxEntries: number,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal?.aborted || entries.length >= maxEntries) {
      return;
    }

    let dirEntries;
    try {
      dirEntries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const dirent of dirEntries) {
      if (signal?.aborted || entries.length >= maxEntries) {
        break;
      }
      if (IGNORED_DIRECTORIES.has(dirent.name)) {
        continue;
      }

      const fullPath = resolve(currentPath, dirent.name);
      entries.push({ path: fullPath, isDirectory: dirent.isDirectory() });

      if (dirent.isDirectory()) {
        await this.walk(join(currentPath, dirent.name), entries, maxEntries, signal);
      }
    }
  }
}
