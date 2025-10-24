import { join } from "node:path";
import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

const prismaSchemaPattern = /prisma[\\/]schema\.prisma$/i;
const prismaMigrationsPattern = /prisma[\\/]migrations/i;

export class PrismaDetector extends FrameworkDetector {
  async detect(context: DetectionContext): Promise<FrameworkSignature | null> {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "@prisma/client",
        weight: 0.45,
        matched: this.hasRuntimeDependency(context, "@prisma/client"),
      },
      {
        type: "dev_tool",
        pattern: "prisma",
        weight: 0.1,
        matched: this.hasDevDependency(context, "prisma"),
      },
      {
        type: "file_pattern",
        pattern: "schema.prisma",
        weight: 0.25,
        matched: this.hasFile(context, prismaSchemaPattern),
      },
      {
        type: "file_pattern",
        pattern: "migrations",
        weight: 0.1,
        matched: this.hasFile(context, prismaMigrationsPattern),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.45) {
      return null;
    }

    const version = this.getRuntimeDependencyVersion(context, "@prisma/client");
    const capabilities: FrameworkCapability[] = [
      {
        category: "database",
        features: ["schema_mapping", "migrations", "type_safe_queries"],
        patterns: [
          {
            name: "Prisma Data Layer",
            description: "Use Prisma Client for typed data access and validation.",
            guidance: "Generate the client during build and reuse a singleton per process.",
            examples: ["const prisma = new PrismaClient(); const user = await prisma.user.findUnique(...);"]
          },
          {
            name: "Migration Governance",
            description: "Automate schema migrations with review gating.",
            guidance: "Check migrations into VCS and promote via migrate deploy in CI.",
          },
        ],
      },
    ];

    return this.buildSignature("prisma", version, indicators, capabilities);
  }

  private hasFile(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }
}
