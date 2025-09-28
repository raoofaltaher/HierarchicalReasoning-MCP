import { ReasoningPattern } from "../types.js";

export interface ReactReasoningContext {
  componentType?: "functional" | "class" | "hook" | "hoc";
  stateManagement?: "useState" | "useReducer" | "context" | "redux" | "zustand" | "recoil";
  renderingStrategy?: "csr" | "ssr" | "ssg" | "isr";
  performanceConcerns?: string[];
  testingFramework?: "jest" | "vitest" | "cypress" | "playwright";
}

export interface ReactReasoningResult {
  framework: "react";
  problemCategory: string;
  reasoning: string[];
  patterns: ReasoningPattern[];
  recommendations: string[];
  codeExamples: string[];
}

const PATTERNS: ReasoningPattern[] = [
  {
    name: "Split Components by Responsibility",
    description: "Break large React components into focused units for maintainability.",
    guidance: "Separate presentation and container logic using hooks and context.",
    examples: ["const useUserProfile = () => { /* hook logic */ }"],
  },
  {
    name: "Optimize Rendering with Memoization",
    description: "Prevent wasteful renders with memoization utilities.",
    guidance: "Combine React.memo with useMemo/useCallback to stabilize references.",
  },
  {
    name: "Progressive Data Fetching",
    description: "Adopt Suspense and data-layer hooks for concurrent features.",
    guidance: "Wrap async boundaries with <Suspense> to defer non-critical UI.",
  },
];

const CATEGORY_KEYWORDS: Record<string, RegExp[]> = {
  performance: [/performance/i, /render/i, /slow/i, /lag/i],
  dataFetching: [/fetch/i, /data/i, /api/i, /swr/i],
  state: [/state/i, /context/i, /redux/i, /store/i],
  testing: [/test/i, /coverage/i, /jest/i, /cypress/i],
};

export class ReactFrameworkSpecialist {
  async generateReactSpecificReasoning(
    problem: string,
    context: ReactReasoningContext = {},
    codeContext?: string,
  ): Promise<ReactReasoningResult> {
    const problemCategory = this.categorize(problem);
    const reasoning: string[] = [
      `Detected React problem category: ${problemCategory}.`,
      this.buildContextSummary(context),
    ];

    if (codeContext) {
      reasoning.push(this.generateCodeContextSummary(codeContext));
    }

    const patterns = this.selectPatterns(problemCategory, context);
    const recommendations = this.generateRecommendations(problemCategory, context);
    const codeExamples = this.generateExamples(problemCategory);

    return {
      framework: "react",
      problemCategory,
      reasoning,
      patterns,
      recommendations,
      codeExamples,
    };
  }

  private categorize(problem: string): string {
    const lowered = problem.toLowerCase();
    for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS)) {
      if (patterns.some((pattern) => pattern.test(lowered))) {
        return category;
      }
    }
    return "general";
  }

  private buildContextSummary(context: ReactReasoningContext): string {
    const segments: string[] = [];
    if (context.componentType) {
      segments.push(`Component type: ${context.componentType}`);
    }
    if (context.stateManagement) {
      segments.push(`State management: ${context.stateManagement}`);
    }
    if (context.renderingStrategy) {
      segments.push(`Rendering strategy: ${context.renderingStrategy}`);
    }
    if (context.performanceConcerns?.length) {
      segments.push(`Performance concerns: ${context.performanceConcerns.join(", ")}`);
    }
    if (context.testingFramework) {
      segments.push(`Testing: ${context.testingFramework}`);
    }
    return segments.length ? segments.join(" | ") : "No React-specific context provided.";
  }

  private selectPatterns(
    category: string,
    context: ReactReasoningContext,
  ): ReasoningPattern[] {
    if (category === "performance") {
      return PATTERNS.filter((pattern) => pattern.name.includes("Optimize"));
    }
    if (category === "dataFetching") {
      return PATTERNS.filter((pattern) => pattern.name.includes("Data") || pattern.name.includes("Progressive"));
    }
    if (category === "state" && context.stateManagement) {
      return PATTERNS.filter((pattern) => pattern.name.includes("Split"));
    }
    return PATTERNS.slice(0, 2);
  }

  private generateRecommendations(category: string, context: ReactReasoningContext): string[] {
    const recs: string[] = [];
    if (category === "performance") {
      recs.push("Profile component renders with React DevTools Profiler.");
      recs.push("Audit prop changes triggering reconciler work.");
    }
    if (category === "state" && context.stateManagement === "context") {
      recs.push("Consider splitting context providers to reduce provider churn.");
    }
    if (category === "dataFetching") {
      recs.push("Adopt SWR or React Query for declarative caching.");
    }
    if (!recs.length) {
      recs.push("Adhere to React hook rules and keep components focused.");
    }
    return recs;
  }

  private generateExamples(category: string): string[] {
    if (category === "performance") {
      return [
        "const MemoizedList = React.memo(List);",
        "const value = useMemo(() => computeExpensiveValue(input), [input]);",
      ];
    }
    if (category === "dataFetching") {
      return [
        "const { data } = useSWR('/api/users', fetcher);",
        "const result = await fetch('/api/posts', { cache: 'no-store' });",
      ];
    }
    return ["function Component() { const [state, setState] = useState(initial); }"];
  }

  private generateCodeContextSummary(codeContext: string): string {
    const length = codeContext.split("\n").length;
    return `Analyzed existing component code (~${length} lines). Apply recommendations incrementally.`;
  }
}
