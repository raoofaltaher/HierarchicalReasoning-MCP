import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

const POSTGRES_DEPENDENCIES = ["pg", "pg-promise", "postgres", "@neondatabase/serverless"];
const POSTGRES_FILE_PATTERN = /(database|db)[\\/](migrations|seeds|queries)/i;

export class PostgreSQLDetector extends FrameworkDetector {
  async detect(context: DetectionContext): Promise<FrameworkSignature | null> {
    const dependencyMatched = POSTGRES_DEPENDENCIES.some((dep) => this.hasDependency(context, dep));
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "pg_family",
        weight: 0.65,
        matched: dependencyMatched,
      },
      {
        type: "file_pattern",
        pattern: "db_directory",
        weight: 0.2,
        matched: this.hasFile(context, POSTGRES_FILE_PATTERN),
      },
      {
        type: "code_pattern",
        pattern: "prisma_postgres",
        weight: 0.15,
        matched: this.hasPrismaPostgresIndicator(context),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.4) {
      return null;
    }

    const version = this.getDependencyVersion(context, POSTGRES_DEPENDENCIES);
    const capabilities: FrameworkCapability[] = [
      {
        category: "database",
        features: ["sql", "transactions", "connection_pooling"],
        patterns: [
          {
            name: "Connection Pooling",
            description: "Manage PostgreSQL connections efficiently in Node environments.",
            guidance: "Reuse a pg.Pool or Prisma client singleton and terminate gracefully on shutdown.",
          },
          {
            name: "Transactional Guards",
            description: "Wrap critical operations in database transactions.",
            guidance: "Use pool.connect() or prisma.$transaction for consistency boundaries.",
          },
        ],
      },
    ];

    return this.buildSignature("postgresql", version, indicators, capabilities);
  }

  private hasDependency(context: DetectionContext, dependency: string): boolean {
    const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = context.packageInfo;
    return Boolean(dependencies[dependency] || devDependencies[dependency] || peerDependencies[dependency]);
  }

  private hasFile(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private hasPrismaPostgresIndicator(context: DetectionContext): boolean {
    return context.fileStructure.some((node) => /prisma[\\/]schema\.prisma$/i.test(node.path));
  }

  private getDependencyVersion(context: DetectionContext, candidates: string[]): string | undefined {
    for (const candidate of candidates) {
      const version = this.getVersion(context, candidate);
      if (version) {
        return version;
      }
    }
    return undefined;
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = context.packageInfo;
    return dependencies[dependency] || devDependencies[dependency] || peerDependencies[dependency];
  }
}
