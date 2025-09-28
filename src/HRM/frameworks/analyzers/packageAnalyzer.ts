import { promises as fs } from "node:fs";
import { join } from "node:path";
import { PackageInfo } from "../types.js";

const emptyInfo: PackageInfo = {
  dependencies: {},
  devDependencies: {},
  peerDependencies: {},
};

export class PackageAnalyzer {
  async analyze(workspacePath: string): Promise<PackageInfo> {
    const packagePath = join(workspacePath, "package.json");
    try {
      const raw = await fs.readFile(packagePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<PackageInfo>;
      return {
        dependencies: parsed.dependencies ?? {},
        devDependencies: parsed.devDependencies ?? {},
        peerDependencies: parsed.peerDependencies ?? {},
        packageJsonPath: packagePath,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyInfo;
      }
      throw error;
    }
  }
}
