import { ReasoningPattern } from "../types.js";

export interface DatabaseReasoningResult {
  framework: "prisma" | "postgresql";
  reasoning: string[];
  patterns: ReasoningPattern[];
  recommendations: string[];
  codeExamples: string[];
}

const PRISMA_PATTERNS: ReasoningPattern[] = [
  {
    name: "Prisma Client Reuse",
    description: "Reuse the Prisma client across requests to avoid exhausting database connections.",
    guidance: "Instantiate a single PrismaClient and attach lifecycle hooks for graceful shutdown.",
    examples: ["const prisma = globalThis.prisma ?? new PrismaClient();"]
  },
  {
    name: "Schema-Driven Validation",
    description: "Keep schema and application validation aligned using Prisma types.",
    guidance: "Derive TS types from Prisma and surface zod schemas for API validation.",
  },
];

const POSTGRES_PATTERNS: ReasoningPattern[] = [
  {
    name: "Migration Discipline",
    description: "Manage schema changes via version-controlled migrations.",
    guidance: "Automate migrations in CI and gate production deployments on successful apply.",
  },
  {
    name: "Performance Observability",
    description: "Collect query metrics and analyze slow queries.",
    guidance: "Enable pg_stat_statements or Prisma Performance to identify hotspots.",
  },
];

export class PrismaDatabaseSpecialist {
  async generate(framework: "prisma" | "postgresql", problem?: string): Promise<DatabaseReasoningResult> {
    const reasoning: string[] = [];
    if (framework === "prisma") {
      reasoning.push("Prisma detected — emphasizing type-safe data access and migration hygiene.");
    } else {
      reasoning.push("PostgreSQL detected — prioritizing connection management and transactional safety.");
    }
    if (problem) {
      reasoning.push(`Problem context: ${problem}`);
    }

    const patterns = framework === "prisma" ? PRISMA_PATTERNS : POSTGRES_PATTERNS;
    const recommendations: string[] = [];

    if (framework === "prisma") {
      recommendations.push(
        "Run `prisma migrate dev` locally and `prisma migrate deploy` in production pipelines.",
      );
      recommendations.push("Promote common read paths to Prisma `select` projections to limit over-fetching.");
    } else {
      recommendations.push("Tune pool size relative to CPU cores and workload saturation.");
      recommendations.push("Leverage prepared statements or parameterized queries to prevent SQL injection.");
    }

    const codeExamples = framework === "prisma"
      ? [
          "const result = await prisma.user.findMany({ where: { active: true }, select: { id: true, email: true } });",
          "await prisma.$transaction(async (tx) => { await tx.order.create(...); await tx.inventory.update(...); });",
        ]
      : [
          "const pool = new Pool({ connectionString: process.env.DATABASE_URL });\nconst client = await pool.connect();\ntry { await client.query('BEGIN'); /* ... */ await client.query('COMMIT'); } finally { client.release(); }",
        ];

    return {
      framework,
      reasoning,
      patterns,
      recommendations,
      codeExamples,
    };
  }
}
