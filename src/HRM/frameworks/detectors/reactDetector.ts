import { DetectionContext, DetectionResult, FrameworkCapability, FrameworkSignature } from "../types.js";
import { FrameworkDetector } from "./baseDetector.js";

export class ReactDetector extends FrameworkDetector {
  async detect(context: DetectionContext): Promise<FrameworkSignature | null> {
    const indicators: DetectionResult[] = [
      {
        type: "dependency",
        pattern: "react",
        weight: 0.4,
        matched: this.hasDependency(context, "react"),
      },
      {
        type: "dependency",
        pattern: "react-dom",
        weight: 0.25,
        matched: this.hasDependency(context, "react-dom"),
      },
      {
        type: "file_pattern",
        pattern: "src/components",
        weight: 0.15,
        matched: this.hasFileContaining(context, /src[\\/](components|hooks)/i),
      },
      {
        type: "code_pattern",
        pattern: "react_component",
        weight: 0.2,
        matched: this.hasCodePattern(context, "react_component"),
      },
    ];

    const confidence = this.calculateConfidence(indicators);
    if (confidence < 0.35) {
      return null;
    }

    const version = this.getVersion(context, "react");
    const capabilities: FrameworkCapability[] = [
      {
        category: "ui",
        features: ["component_model", "hooks", "jsx"],
        patterns: [
          {
            name: "Hook-based State Management",
            description: "Use React hooks to manage local and shared state effectively.",
            guidance: "Prefer useReducer for complex state transitions and useContext for shared state.",
            examples: [
              `const [state, dispatch] = useReducer(reducer, initialState);`,
            ],
          },
          {
            name: "Memoization Patterns",
            description: "Memoize expensive computations and components.",
            guidance: "Use useMemo and React.memo to prevent unnecessary renders.",
          },
        ],
      },
      {
        category: "state_management",
        features: ["context_api", "hooks", "redux_support"],
        patterns: [
          {
            name: "Context Segmentation",
            description: "Split context providers to minimize re-renders.",
            guidance: "Create focused contexts for independent state domains.",
          },
        ],
      },
      {
        category: "testing",
        features: ["rtl", "jest"],
        patterns: [
          {
            name: "React Testing Library",
            description: "Test components through user interactions.",
            guidance: "Favor queries by role and text to emulate user behavior.",
          },
        ],
      },
    ];

    return this.buildSignature("react", version, indicators, capabilities);
  }

  private hasDependency(context: DetectionContext, name: string): boolean {
    const { dependencies, devDependencies, peerDependencies } = context.packageInfo;
    return Boolean(dependencies?.[name] || devDependencies?.[name] || peerDependencies?.[name]);
  }

  private hasFileContaining(context: DetectionContext, pattern: RegExp): boolean {
    return context.fileStructure.some((node) => pattern.test(node.path));
  }

  private hasCodePattern(context: DetectionContext, identifier: string): boolean {
    return context.codePatterns.some((pattern) => pattern.identifier === identifier);
  }

  private getVersion(context: DetectionContext, dependency: string): string | undefined {
    return (
      context.packageInfo.dependencies?.[dependency] ||
      context.packageInfo.devDependencies?.[dependency] ||
      context.packageInfo.peerDependencies?.[dependency]
    );
  }
}
