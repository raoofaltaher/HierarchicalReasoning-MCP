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
}
