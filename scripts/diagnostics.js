#!/usr/bin/env node

/**
 * HRM Diagnostics Utility
 *
 * Command-line tool to dump session diagnostics for debugging and analysis.
 *
 * Usage:
 *   node scripts/diagnostics.js <session-id>
 *   npm run diagnostics <session-id>
 *
 * Output includes:
 * - Session metadata (ID, timestamps, cycles)
 * - Current state (contexts, candidates, metrics)
 * - Reasoning metrics history
 * - Plateau detection data
 * - Framework detection insights
 * - Recent decisions and pending actions
 * - Auto-reasoning trace (if available)
 *
 * Example:
 *   node scripts/diagnostics.js 550e8400-e29b-41d4-a716-446655440000
 */

import { SessionManager } from "../src/HRM/state.js";
import { DEFAULT_SESSION_TTL_MS } from "../src/HRM/constants.js";
import chalk from "chalk";
import Table from "cli-table3";

const sessionId = process.argv[2];

if (!sessionId) {
  console.error(chalk.red("Error: Session ID required"));
  console.log(chalk.yellow("\nUsage:"));
  console.log(chalk.cyan("  node scripts/diagnostics.js <session-id>"));
  console.log(chalk.cyan("  npm run diagnostics <session-id>"));
  console.log(chalk.yellow("\nExample:"));
  console.log(
    chalk.cyan(
      "  node scripts/diagnostics.js 550e8400-e29b-41d4-a716-446655440000"
    )
  );
  process.exit(1);
}

// Note: This script accesses an in-memory session manager
// In production, sessions are only accessible during server runtime
// This is a demonstration of the diagnostic format

console.log(
  chalk.bold.blue("\n═══════════════════════════════════════════════════════")
);
console.log(chalk.bold.blue("   HRM Session Diagnostics Report"));
console.log(
  chalk.bold.blue("═══════════════════════════════════════════════════════\n")
);

console.log(chalk.yellow("Session ID:"), chalk.white(sessionId));
console.log(chalk.dim("Generated at:"), chalk.dim(new Date().toISOString()));
console.log(
  chalk.dim("─────────────────────────────────────────────────────────\n")
);

// In a real implementation, this would connect to a running server
// or read from a persistence layer. For now, demonstrate the format.

const mockSession = {
  sessionId,
  hCycle: 2,
  lCycle: 1,
  maxLCyclesPerH: 3,
  maxHCycles: 4,
  hContext: [
    "High-level strategic plan for user authentication",
    "Consider security best practices and JWT implementation",
  ],
  lContext: [
    "Define authentication middleware structure",
    "Implement token validation logic",
    "Set up password hashing with bcrypt",
  ],
  solutionCandidates: [
    "JWT-based authentication with refresh tokens",
    "Session-based authentication with Redis",
  ],
  convergenceThreshold: 0.85,
  metrics: {
    confidenceScore: 0.72,
    convergenceScore: 0.68,
    complexityAssessment: 6,
    shouldContinue: true,
  },
  lastUpdated: Date.now() - 5000,
  recentDecisions: [
    "h_plan: Initial architecture planning",
    "l_execute: Define middleware structure",
    "evaluate: Assess current progress",
  ],
  pendingActions: ["h_update"],
  autoMode: false,
  problem: "Implement secure user authentication system",
  complexityEstimate: 6,
  workspacePath: "/path/to/workspace",
  frameworkInsight: {
    signatures: [
      { name: "Express", confidence: 0.95 },
      { name: "Prisma", confidence: 0.88 },
    ],
    reasoningHighlights: [
      "Express middleware patterns recommended",
      "Prisma client for database access",
    ],
    recommendedPatterns: [],
  },
  frameworkNotes: [
    "Detected Express - recommend async error handling",
    "Detected Prisma - use transaction support for auth operations",
  ],
  metricHistory: [0.45, 0.52, 0.61, 0.68],
  plateauCount: 0,
  recentLThoughtHashes: [],
};

console.log(chalk.bold.cyan("📊 Session Overview\n"));

const overviewTable = new Table({
  head: [chalk.white("Metric"), chalk.white("Value")],
  colWidths: [30, 50],
});

overviewTable.push(
  ["Session ID", mockSession.sessionId],
  ["Problem Statement", mockSession.problem || "N/A"],
  ["Auto Mode", mockSession.autoMode ? chalk.green("Yes") : chalk.gray("No")],
  ["Complexity Estimate", `${mockSession.complexityEstimate}/10`],
  [
    "Convergence Threshold",
    (mockSession.convergenceThreshold * 100).toFixed(0) + "%",
  ],
  ["Last Updated", new Date(mockSession.lastUpdated).toLocaleString()],
  ["Age", Math.floor((Date.now() - mockSession.lastUpdated) / 1000) + "s ago"]
);

console.log(overviewTable.toString() + "\n");

console.log(chalk.bold.cyan("🔄 Cycle Progress\n"));

const cycleTable = new Table({
  head: [
    chalk.white("Cycle Type"),
    chalk.white("Current"),
    chalk.white("Maximum"),
    chalk.white("Progress"),
  ],
});

const hProgress = ((mockSession.hCycle / mockSession.maxHCycles) * 100).toFixed(
  0
);
const lProgress = (
  (mockSession.lCycle / mockSession.maxLCyclesPerH) *
  100
).toFixed(0);

cycleTable.push(
  [
    "High-Level (H)",
    mockSession.hCycle,
    mockSession.maxHCycles,
    `${hProgress}%`,
  ],
  [
    "Low-Level (L)",
    mockSession.lCycle,
    mockSession.maxLCyclesPerH,
    `${lProgress}%`,
  ]
);

console.log(cycleTable.toString() + "\n");

console.log(chalk.bold.cyan("📈 Reasoning Metrics\n"));

const metricsTable = new Table({
  head: [chalk.white("Metric"), chalk.white("Value"), chalk.white("Status")],
});

const getMetricStatus = (value, threshold) => {
  if (value >= threshold) return chalk.green("✓ Good");
  if (value >= threshold * 0.8) return chalk.yellow("⚠ Fair");
  return chalk.red("✗ Low");
};

metricsTable.push(
  [
    "Confidence Score",
    (mockSession.metrics.confidenceScore * 100).toFixed(1) + "%",
    getMetricStatus(mockSession.metrics.confidenceScore, 0.8),
  ],
  [
    "Convergence Score",
    (mockSession.metrics.convergenceScore * 100).toFixed(1) + "%",
    getMetricStatus(
      mockSession.metrics.convergenceScore,
      mockSession.convergenceThreshold
    ),
  ],
  [
    "Should Continue",
    mockSession.metrics.shouldContinue
      ? chalk.green("Yes")
      : chalk.yellow("No"),
    mockSession.metrics.shouldContinue
      ? "→ More reasoning needed"
      : "→ Ready for completion",
  ],
  [
    "Plateau Count",
    mockSession.plateauCount.toString(),
    mockSession.plateauCount >= 2
      ? chalk.red("⚠ Plateau detected")
      : chalk.green("✓ Progressing"),
  ]
);

console.log(metricsTable.toString() + "\n");

console.log(chalk.bold.cyan("📊 Metrics History\n"));
console.log(chalk.dim("Confidence score progression:"));
mockSession.metricHistory.forEach((value, index) => {
  const bar = "█".repeat(Math.floor(value * 50));
  const percent = (value * 100).toFixed(1);
  console.log(
    chalk.gray(`  ${index + 1}:`) +
      chalk.cyan(` ${bar} `) +
      chalk.white(`${percent}%`)
  );
});
console.log();

console.log(chalk.bold.cyan("🧩 Solution Candidates\n"));
if (mockSession.solutionCandidates.length > 0) {
  mockSession.solutionCandidates.forEach((candidate, index) => {
    console.log(chalk.green(`  ${index + 1}.`), chalk.white(candidate));
  });
} else {
  console.log(chalk.dim("  No solution candidates yet"));
}
console.log();

console.log(chalk.bold.cyan("🔍 Framework Detection\n"));
if (
  mockSession.frameworkInsight &&
  mockSession.frameworkInsight.signatures.length > 0
) {
  const frameworkTable = new Table({
    head: [chalk.white("Framework"), chalk.white("Confidence")],
  });

  mockSession.frameworkInsight.signatures.forEach((sig) => {
    const confidence = (sig.confidence * 100).toFixed(0);
    const confidenceColor =
      sig.confidence >= 0.8
        ? chalk.green
        : sig.confidence >= 0.5
        ? chalk.yellow
        : chalk.red;
    frameworkTable.push([sig.name, confidenceColor(`${confidence}%`)]);
  });

  console.log(frameworkTable.toString() + "\n");

  if (mockSession.frameworkInsight.reasoningHighlights.length > 0) {
    console.log(chalk.dim("Reasoning Highlights:"));
    mockSession.frameworkInsight.reasoningHighlights.forEach(
      (highlight) => {
        console.log(chalk.gray("  •"), chalk.white(highlight));
      }
    );
    console.log();
  }
} else {
  console.log(chalk.dim("  No frameworks detected\n"));
}

console.log(chalk.bold.cyan("📝 Context Summary\n"));
console.log(
  chalk.yellow("High-Level Context") +
    chalk.dim(` (${mockSession.hContext.length} entries):`)
);
mockSession.hContext.slice(0, 3).forEach((entry, index) => {
  const truncated = entry.length > 80 ? entry.substring(0, 77) + "..." : entry;
  console.log(chalk.gray(`  ${index + 1}.`), chalk.white(truncated));
});
if (mockSession.hContext.length > 3) {
  console.log(
    chalk.dim(`  ... and ${mockSession.hContext.length - 3} more entries`)
  );
}
console.log();

console.log(
  chalk.yellow("Low-Level Context") +
    chalk.dim(` (${mockSession.lContext.length} entries):`)
);
mockSession.lContext.slice(0, 3).forEach((entry, index) => {
  const truncated = entry.length > 80 ? entry.substring(0, 77) + "..." : entry;
  console.log(chalk.gray(`  ${index + 1}.`), chalk.white(truncated));
});
if (mockSession.lContext.length > 3) {
  console.log(
    chalk.dim(`  ... and ${mockSession.lContext.length - 3} more entries`)
  );
}
console.log();

console.log(chalk.bold.cyan("⚡ Recent Activity\n"));
console.log(
  chalk.yellow("Recent Decisions") +
    chalk.dim(` (last ${Math.min(3, mockSession.recentDecisions.length)}):`)
);
mockSession.recentDecisions.slice(-3).forEach((decision, index) => {
  console.log(chalk.gray(`  ${index + 1}.`), chalk.white(decision));
});
console.log();

if (mockSession.pendingActions.length > 0) {
  console.log(chalk.yellow("Pending Actions:"));
  mockSession.pendingActions.forEach((action) => {
    console.log(chalk.gray("  →"), chalk.cyan(action));
  });
  console.log();
}

console.log(
  chalk.bold.blue("═══════════════════════════════════════════════════════")
);
console.log(chalk.bold.blue("   End of Diagnostics Report"));
console.log(
  chalk.bold.blue("═══════════════════════════════════════════════════════\n")
);

console.log(
  chalk.dim("Note: This is a demonstration format. In production, this tool")
);
console.log(
  chalk.dim("would connect to the running MCP server or persistence layer.")
);
console.log();
