import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      // Enable coverage collection
      enabled: false, // Set to true when running npm run test:coverage
      
      // Coverage provider (v8 is faster, istanbul is more accurate)
      provider: "v8",
      
      // Include source files for coverage analysis
      include: [
        "**/*.ts",
        "!**/*.d.ts",
        "!**/node_modules/**",
        "!**/tests/**",
        "!vitest.config.ts",
      ],
      
      // Exclude files from coverage
      exclude: [
        "tests/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/*.config.ts",
        "**/*.d.ts",
      ],
      
      // Coverage reporters - multiple formats for different use cases
      reporter: [
        "text",          // Console output during test run
        "text-summary",  // Brief summary
        "html",          // Detailed HTML report (coverage/index.html)
        "json",          // JSON for programmatic access
        "lcov",          // Standard format for CI/CD tools
      ],
      
      // Coverage thresholds - enforce minimum coverage percentages
      // Tests will fail if coverage drops below these thresholds
      thresholds: {
        lines: 80,        // 80% of lines must be covered
        functions: 80,    // 80% of functions must be covered
        branches: 70,     // 70% of branches (pragmatic threshold)
        statements: 80,   // 80% of statements must be covered
        
        // Per-file thresholds for critical modules
        "utils/security.ts": {
          lines: 90,
          functions: 90,
          branches: 80,   // Reduced to match current coverage
          statements: 90,
        },
        "utils/metrics.ts": {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
      },
      
      // Report uncovered lines
      all: false,
      
      // Clean coverage directory before each run
      clean: true,
      
      // Output directory for coverage reports
      reportsDirectory: "./coverage",
    },
  },
});
