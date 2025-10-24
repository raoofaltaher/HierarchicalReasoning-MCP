import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";

export abstract class FrameworkDetector {
  abstract detect(context: DetectionContext): Promise<FrameworkSignature | null>;

  protected buildSignature(
    name: string,
    version: string | undefined,
    indicators: DetectionResult[],
    capabilities: FrameworkCapability[],
  ): FrameworkSignature {
    const confidence = this.calculateConfidence(indicators);
    const summary = this.createSummary(name, confidence, capabilities);
    return {
      name,
      version,
      confidence,
      indicators,
      capabilities,
      summary,
    };
  }

  protected calculateConfidence(indicators: DetectionResult[]): number {
    const total = indicators.reduce((sum, indicator) => sum + indicator.weight, 0);
    if (!total) {
      return 0;
    }
    const matched = indicators
      .filter((indicator) => indicator.matched)
      .reduce((sum, indicator) => sum + indicator.weight, 0);
    return matched / total;
  }

  private createSummary(
    name: string,
    confidence: number,
    capabilities: FrameworkCapability[],
  ): string {
    const capabilitySummary = capabilities
      .map((capability) => `${capability.category}: ${capability.features.slice(0, 3).join(", ")}`)
      .join(" | ");
    return `${name} detected (confidence ${(confidence * 100).toFixed(0)}%). Capabilities: ${capabilitySummary}`;
  }

  /**
   * Check if package exists in runtime dependencies (dependencies + peerDependencies).
   * Excludes devDependencies to avoid false positives from test/build-only packages.
   * 
   * @param context Detection context with package info
   * @param name Exact package name (e.g., "react", "@angular/core")
   * @returns true if found in runtime dependencies
   */
  protected hasRuntimeDependency(context: DetectionContext, name: string): boolean {
    const { dependencies, peerDependencies } = context.packageInfo;
    return Boolean(dependencies?.[name] || peerDependencies?.[name]);
  }

  /**
   * Check if package exists in dev dependencies only.
   * Useful for detecting CLI tools or build-time indicators with lower confidence.
   * 
   * @param context Detection context with package info
   * @param name Exact package name
   * @returns true if found in devDependencies
   */
  protected hasDevDependency(context: DetectionContext, name: string): boolean {
    return Boolean(context.packageInfo.devDependencies?.[name]);
  }

  /**
   * Check if package exists in any dependency type.
   * Use sparingly - prefer hasRuntimeDependency() for framework detection.
   * 
   * @param context Detection context with package info
   * @param name Exact package name
   * @returns true if found in any dependency type
   */
  protected hasAnyDependency(context: DetectionContext, name: string): boolean {
    const { dependencies, devDependencies, peerDependencies } = context.packageInfo;
    return Boolean(dependencies?.[name] || devDependencies?.[name] || peerDependencies?.[name]);
  }

  /**
   * Get version string from runtime dependencies only.
   * 
   * @param context Detection context with package info
   * @param name Exact package name
   * @returns Version string or undefined if not found
   */
  protected getRuntimeDependencyVersion(context: DetectionContext, name: string): string | undefined {
    return context.packageInfo.dependencies?.[name] || context.packageInfo.peerDependencies?.[name];
  }
}
