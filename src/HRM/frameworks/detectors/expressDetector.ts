import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

const expressFilePattern = /(src|server|app)[\\/](routes|controllers|middleware)/i;
const expressEntryPattern = /(server|app)\.(js|ts)$/i;

export class ExpressDetector extends FrameworkDetector {
  async detect(context: DetectionContext): Promise<FrameworkSignature | null> {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "express",
        weight: 0.5,
        matched: this.hasRuntimeDependency(context, "express"),
      },
      {
        type: "dependency",
        pattern: "cors",
        weight: 0.15,
        matched: this.hasRuntimeDependency(context, "cors") || this.hasRuntimeDependency(context, "body-parser"),
      },
      {
        type: "file_pattern",
        pattern: "routes_directory",
        weight: 0.2,
        matched: this.hasFile(context, expressFilePattern),
      },
      {
        type: "file_pattern",
        pattern: "server_entry",
        weight: 0.15,
        matched: this.hasFile(context, expressEntryPattern),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.4) {
      return null;
    }

    const version = this.getVersion(context, "express");
    const capabilities: FrameworkCapability[] = [
      {
        category: "backend",
        features: ["rest_endpoints", "middleware_stack", "error_handling"],
        patterns: [
          {
            name: "Layered Routing",
            description: "Organize Express routes using dedicated router modules.",
            guidance: "Use express.Router() per domain and mount in app.ts with versioned prefixes.",
            examples: ["const router = Router(); router.get('/users', handler);"]
          },
          {
            name: "Centralized Error Handling",
            description: "Attach a single error-handling middleware for consistent responses.",
            guidance: "Finalize middleware chain with (err, req, res, next) => {...}.",
          },
        ],
      },
      {
        category: "testing",
        features: ["supertest", "integration_testing"],
        patterns: [
          {
            name: "Supertest Integration",
            description: "Validate HTTP contracts using Supertest against the Express app.",
            guidance: "Export the express app without listen() for test harnesses.",
          },
        ],
      },
    ];

    return this.buildSignature("express", version, indicators, capabilities);
  }

  private hasFile(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return this.getRuntimeDependencyVersion(context, dependency);
  }
}
