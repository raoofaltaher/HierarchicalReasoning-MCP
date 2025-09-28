import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

export class NextJSDetector extends FrameworkDetector {
  async detect(context: DetectionContext): Promise<FrameworkSignature | null> {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "next",
        weight: 0.5,
        matched: this.hasDependency(context, "next"),
      },
      {
        type: "file_pattern",
        pattern: "pages_directory",
        weight: 0.2,
        matched: this.hasDirectory(context, /(\\|\/)pages$/),
      },
      {
        type: "file_pattern",
        pattern: "app_directory",
        weight: 0.2,
        matched: this.hasDirectory(context, /(\\|\/)app$/),
      },
      {
        type: "config_file",
        pattern: "next.config.js",
        weight: 0.1,
        matched: this.hasConfig(context, /next\.config\.(js|mjs|ts)$/),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.4) {
      return null;
    }

    const version = this.getVersion(context, "next");
    const capabilities: FrameworkCapability[] = [
      {
        category: "ui",
        features: ["hybrid_rendering", "server_components", "dynamic_routes"],
        patterns: [
          {
            name: "App Router Structure",
            description: "Organize routes using the Next.js App Router.",
            guidance: "Use layout.tsx for shared chrome and page.tsx for individual routes.",
          },
          {
            name: "Streaming Rendering",
            description: "Leverage React Server Components for faster render.",
            guidance: "Adopt async server components and Suspense boundaries.",
          },
        ],
      },
      {
        category: "routing",
        features: ["file_system_routes", "api_routes"],
        patterns: [
          {
            name: "Route Grouping",
            description: "Group routes logically using parentheses segments.",
            guidance: "Use (marketing) or (dashboard) to separate app zones.",
          },
        ],
      },
      {
        category: "backend",
        features: ["edge_runtime", "api_routes"],
        patterns: [
          {
            name: "Route Handlers",
            description: "Implement REST endpoints via route handlers.",
            guidance: "Export GET/POST functions from app/api segments.",
          },
        ],
      },
    ];

    return this.buildSignature("nextjs", version, indicators, capabilities);
  }

  private hasDependency(context: DetectionContext, name: string): boolean {
    const { dependencies, devDependencies, peerDependencies } = context.packageInfo;
    return Boolean(dependencies?.[name] || devDependencies?.[name] || peerDependencies?.[name]);
  }

  private hasDirectory(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => node.isDirectory && pattern.test(node.path));
  }

  private hasConfig(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => !node.isDirectory && pattern.test(node.path));
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return (
      context.packageInfo.dependencies?.[dependency] ||
      context.packageInfo.devDependencies?.[dependency] ||
      context.packageInfo.peerDependencies?.[dependency]
    );
  }
}
