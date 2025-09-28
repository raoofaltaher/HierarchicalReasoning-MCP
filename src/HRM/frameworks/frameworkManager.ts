import { existsSync } from "node:fs";
import { FrameworkDetectionEngine } from "./detectionEngine.js";
import { FrameworkInsight, ReasoningPattern } from "./types.js";
import { ReactFrameworkSpecialist } from "./react/reactSpecialist.js";
import { ExpressFrameworkSpecialist } from "./express/expressSpecialist.js";
import { PrismaDatabaseSpecialist } from "./database/prismaSpecialist.js";

export interface FrameworkReasoningRequest {
  workspacePath?: string;
  problem?: string;
  reactContext?: Parameters<ReactFrameworkSpecialist["generateReactSpecificReasoning"]>[1];
  codeContext?: string;
}

export interface FrameworkReasoningResponse {
  insight: FrameworkInsight | null;
  specializedPatterns: ReasoningPattern[];
  notes: string[];
}

export class FrameworkReasoningManager {
  private detectionEngine = new FrameworkDetectionEngine();
  private reactSpecialist = new ReactFrameworkSpecialist();
  private expressSpecialist = new ExpressFrameworkSpecialist();
  private prismaSpecialist = new PrismaDatabaseSpecialist();

  async generateReasoning(request: FrameworkReasoningRequest): Promise<FrameworkReasoningResponse> {
    const notes: string[] = [];
    const specializedPatterns: ReasoningPattern[] = [];
    const patternNames = new Set<string>();
    const processed = new Set<string>();
    let insight: FrameworkInsight | null = null;

    const addPatterns = (patterns: ReasoningPattern[]) => {
      for (const pattern of patterns) {
        if (!patternNames.has(pattern.name)) {
          patternNames.add(pattern.name);
          specializedPatterns.push(pattern);
        }
      }
    };

    const appendNotes = (items: string[], prefix?: string) => {
      for (const item of items) {
        notes.push(prefix ? `${prefix}${item}` : item);
      }
    };

    const appendExamples = (examples: string[]) => {
      for (const example of examples) {
        notes.push(`Example:\n${example}`);
      }
    };

    const problemLower = request.problem?.toLowerCase() ?? "";

    if (request.workspacePath && existsSync(request.workspacePath)) {
      try {
        insight = await this.detectionEngine.detect({ workspacePath: request.workspacePath });
        notes.push(`Framework detection completed for ${request.workspacePath}.`);
      } catch (error) {
        notes.push(`Framework detection failed: ${(error as Error).message}`);
      }
    }

    const handleReact = async () => {
      if (processed.has("react")) {
        return;
      }
      const reactResult = await this.reactSpecialist.generateReactSpecificReasoning(
        request.problem ?? "",
        request.reactContext,
        request.codeContext,
      );
      addPatterns(reactResult.patterns);
      appendNotes(reactResult.reasoning);
      appendNotes(reactResult.recommendations);
      appendExamples(reactResult.codeExamples);
      processed.add("react");
    };

    const handleExpress = async () => {
      if (processed.has("express")) {
        return;
      }
      const expressResult = await this.expressSpecialist.generate(request.problem);
      addPatterns(expressResult.patterns);
      appendNotes(expressResult.reasoning);
      appendNotes(expressResult.recommendations);
      appendExamples(expressResult.codeExamples);
      processed.add("express");
    };

    const handleDatabase = async (framework: "prisma" | "postgresql") => {
      if (processed.has(framework)) {
        return;
      }
      const dbResult = await this.prismaSpecialist.generate(framework, request.problem);
      addPatterns(dbResult.patterns);
      appendNotes(dbResult.reasoning);
      appendNotes(dbResult.recommendations);
      appendExamples(dbResult.codeExamples);
      processed.add(framework);
    };

    if (insight) {
      for (const signature of insight.signatures) {
        switch (signature.name) {
          case "react":
            await handleReact();
            break;
          case "express":
            await handleExpress();
            break;
          case "prisma":
            await handleDatabase("prisma");
            break;
          case "postgresql":
            await handleDatabase("postgresql");
            break;
          default:
            break;
        }
      }
    }

    if (!processed.has("react") && problemLower.includes("react")) {
      await handleReact();
    }

    if (!processed.has("express") && (problemLower.includes("express") || problemLower.includes("api"))) {
      await handleExpress();
    }

    if (
      !processed.has("prisma") &&
      (problemLower.includes("prisma") || problemLower.includes("database") || problemLower.includes("postgres"))
    ) {
      await handleDatabase("prisma");
    }

    if (!processed.has("postgresql") && problemLower.includes("postgres")) {
      await handleDatabase("postgresql");
    }

    return {
      insight,
      specializedPatterns,
      notes,
    };
  }
}
