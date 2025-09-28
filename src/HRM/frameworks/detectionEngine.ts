import {
  FrameworkDetectionOptions,
  FrameworkSignature,
  FrameworkInsight,
  ReasoningPattern,
} from "./types.js";
import { WorkspaceAnalyzer } from "./analyzers/workspaceAnalyzer.js";
import { PackageAnalyzer } from "./analyzers/packageAnalyzer.js";
import { FrameworkDetector } from "./detectors/baseDetector.js";
import { ReactDetector } from "./detectors/reactDetector.js";
import { NextJSDetector } from "./detectors/nextDetector.js";
import { ExpressDetector } from "./detectors/expressDetector.js";
import { PrismaDetector } from "./detectors/prismaDetector.js";
import { PostgreSQLDetector } from "./detectors/postgresDetector.js";
import {
  AngularDetector,
  FastifyDetector,
  MongoDBDetector,
  MySQLDetector,
  NestJSDetector,
  TypeORMDetector,
  VueDetector,
} from "./detectors/placeholders.js";

const DEFAULT_THRESHOLD = 0.35;

export class FrameworkDetectionEngine {
  private detectors: FrameworkDetector[] = [];
  private workspaceAnalyzer = new WorkspaceAnalyzer();
  private packageAnalyzer = new PackageAnalyzer();

  constructor() {
    this.detectors = [
      new ReactDetector(),
      new NextJSDetector(),
      new ExpressDetector(),
      new PrismaDetector(),
      new PostgreSQLDetector(),
      new VueDetector(),
      new AngularDetector(),
      new FastifyDetector(),
      new NestJSDetector(),
      new MongoDBDetector(),
      new MySQLDetector(),
      new TypeORMDetector(),
    ];
  }

  async detect(options: FrameworkDetectionOptions): Promise<FrameworkInsight> {
    const { workspacePath, includeCodePatterns = true, signal } = options;
    const [packageInfo, fileStructure] = await Promise.all([
      this.packageAnalyzer.analyze(workspacePath),
      this.workspaceAnalyzer.analyzeStructure(workspacePath, { signal }),
    ]);

    const codePatterns = includeCodePatterns
      ? await this.workspaceAnalyzer.analyzeCodePatterns(workspacePath, { signal })
      : [];

    const detectionContext = { packageInfo, fileStructure, codePatterns, workspacePath };

    const signatures: FrameworkSignature[] = [];
    for (const detector of this.detectors) {
      const result = await detector.detect(detectionContext);
      if (result && result.confidence >= DEFAULT_THRESHOLD) {
        signatures.push(result);
      }
    }

    const reasoningHighlights = signatures.map((signature) => signature.summary);
    const recommendedPatterns = signatures.flatMap((signature) =>
      signature.capabilities.flatMap((capability) => capability.patterns.slice(0, 2)),
    );

    return {
      signatures: signatures.sort((a, b) => b.confidence - a.confidence),
      reasoningHighlights,
      recommendedPatterns: dedupePatterns(recommendedPatterns).slice(0, 6),
    };
  }
}

const dedupePatterns = (patterns: ReasoningPattern[]): ReasoningPattern[] => {
  const seen = new Set<string>();
  const result: ReasoningPattern[] = [];
  for (const pattern of patterns) {
    const key = pattern.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(pattern);
    }
  }
  return result;
};
