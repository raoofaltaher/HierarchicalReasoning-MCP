import { describe, it, expect } from "vitest";
import { ReactDetector } from "../frameworks/detectors/reactDetector.js";
import { AngularDetector } from "../frameworks/detectors/angularDetector.js";
import { VueDetector } from "../frameworks/detectors/vueDetector.js";
import { PrismaDetector } from "../frameworks/detectors/prismaDetector.js";
import type { DetectionContext } from "../frameworks/types.js";

describe("Boundary-Aware Framework Detection", () => {
  describe("React Detection", () => {
    it("should detect React when in dependencies (runtime)", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
          devDependencies: {},
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new ReactDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("react");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.65); // 0.4 + 0.25 for both deps
    });

    it("should detect React when in peerDependencies", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {},
          devDependencies: {},
          peerDependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new ReactDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("react");
      expect(result?.confidence).toBeGreaterThanOrEqual(0.65);
    });

    it("should NOT detect React when ONLY in devDependencies", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {},
          devDependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new ReactDetector();
      const result = await detector.detect(context);

      // Should return null because confidence is 0 (no runtime deps matched)
      expect(result).toBeNull();
    });

    it("should detect React with mixed dependencies correctly", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { react: "^18.0.0" }, // Runtime
          devDependencies: { "react-dom": "^18.0.0" }, // Dev (shouldn't count)
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new ReactDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("react");
      // Only react (0.4) should match, react-dom in devDeps won't count
      // 0.4 / 1.0 total = 0.4 confidence
      expect(result?.confidence).toBeCloseTo(0.4, 1);
    });
  });

  describe("Angular Detection", () => {
    it("should detect Angular with CLI in devDependencies at lower confidence", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { "@angular/core": "^17.0.0" },
          devDependencies: { "@angular/cli": "^17.0.0" },
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new AngularDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Angular");
      
      // @angular/core: 0.4 weight matched
      // @angular/cli: 0.1 weight (reduced from 0.2, dev_tool type)
      // Total weight: 0.4 + 0.1 + 0.15 + 0.15 + 0.1 = 0.9
      // Matched: 0.4 + 0.1 = 0.5
      // Confidence: 0.5 / 0.9 ≈ 0.556
      expect(result?.confidence).toBeGreaterThan(0.4);
      expect(result?.confidence).toBeLessThan(0.7);

      // Verify CLI indicator type is dev_tool
      const cliIndicator = result?.indicators.find(ind => ind.pattern === "@angular/cli");
      expect(cliIndicator?.type).toBe("dev_tool");
      expect(cliIndicator?.weight).toBe(0.1);
    });

    it("should NOT detect Angular when ONLY CLI in devDependencies", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {},
          devDependencies: { "@angular/cli": "^17.0.0" },
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new AngularDetector();
      const result = await detector.detect(context);

      // Only CLI matched (0.1 / 0.9 total ≈ 0.11), below 0.35 threshold
      expect(result).toBeNull();
    });
  });

  describe("Vue Detection", () => {
    it("should detect Vue when in runtime dependencies", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { vue: "^3.4.0" },
          devDependencies: {},
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new VueDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Vue.js");
      expect(result?.confidence).toBeGreaterThan(0.35);
    });

    it("should NOT detect Vue when only in devDependencies", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {},
          devDependencies: { vue: "^3.4.0" },
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new VueDetector();
      const result = await detector.detect(context);

      expect(result).toBeNull();
    });
  });

  describe("Prisma Detection (dev_tool pattern)", () => {
    it("should detect Prisma with @prisma/client in runtime deps", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { "@prisma/client": "^5.0.0" },
          devDependencies: { prisma: "^5.0.0" }, // Dev tool
          peerDependencies: {},
        },
        fileStructure: [
          { path: "prisma/schema.prisma", isDirectory: false },
        ],
        codePatterns: [],
      };

      const detector = new PrismaDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("prisma");
      
      // @prisma/client: 0.45 matched
      // prisma (dev_tool): 0.1 matched
      // schema.prisma: 0.25 matched
      // Total: 0.45 + 0.1 + 0.25 + 0.1 = 0.9
      // Matched: 0.45 + 0.1 + 0.25 = 0.8
      // Confidence: 0.8 / 0.9 ≈ 0.889
      expect(result?.confidence).toBeGreaterThan(0.8);

      // Verify prisma CLI is marked as dev_tool
      const prismaIndicator = result?.indicators.find(ind => ind.pattern === "prisma");
      expect(prismaIndicator?.type).toBe("dev_tool");
      expect(prismaIndicator?.weight).toBe(0.1);
    });

    it("should NOT detect Prisma with only dev tools (no client)", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {},
          devDependencies: { prisma: "^5.0.0" },
          peerDependencies: {},
        },
        fileStructure: [],
        codePatterns: [],
      };

      const detector = new PrismaDetector();
      const result = await detector.detect(context);

      // Only prisma CLI (0.1 / 0.9 ≈ 0.11), below 0.45 threshold
      expect(result).toBeNull();
    });

    it("should use version from @prisma/client (runtime) not prisma (dev)", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: { "@prisma/client": "^5.2.0" },
          devDependencies: { prisma: "^5.1.0" }, // Different version
          peerDependencies: {},
        },
        fileStructure: [
          { path: "prisma/schema.prisma", isDirectory: false },
        ],
        codePatterns: [],
      };

      const detector = new PrismaDetector();
      const result = await detector.detect(context);

      expect(result).not.toBeNull();
      // Should use version from @prisma/client (runtime dependency)
      expect(result?.version).toBe("^5.2.0");
    });
  });

  describe("Cross-Framework Scenarios", () => {
    it("should handle workspace with multiple frameworks (runtime + dev deps)", async () => {
      const context: DetectionContext = {
        packageInfo: {
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
            "@prisma/client": "^5.0.0",
          },
          devDependencies: {
            vue: "^3.4.0", // Testing with Vue
            prisma: "^5.0.0",
            "@angular/cli": "^17.0.0", // Angular CLI for code generation
          },
          peerDependencies: {},
        },
        fileStructure: [
          { path: "src/components/Button.tsx", isDirectory: false },
          { path: "prisma/schema.prisma", isDirectory: false },
        ],
        codePatterns: [
          { identifier: "react_component", count: 5 },
        ],
      };

      // React should be detected (runtime dependencies)
      const reactDetector = new ReactDetector();
      const reactResult = await reactDetector.detect(context);
      expect(reactResult).not.toBeNull();
      expect(reactResult?.confidence).toBeGreaterThan(0.7);

      // Vue should NOT be detected (only dev dependency)
      const vueDetector = new VueDetector();
      const vueResult = await vueDetector.detect(context);
      expect(vueResult).toBeNull();

      // Prisma should be detected (runtime @prisma/client)
      const prismaDetector = new PrismaDetector();
      const prismaResult = await prismaDetector.detect(context);
      expect(prismaResult).not.toBeNull();

      // Angular should NOT be detected (only CLI in devDeps, no core)
      const angularDetector = new AngularDetector();
      const angularResult = await angularDetector.detect(context);
      expect(angularResult).toBeNull();
    });
  });
});
