export type DetectionIndicatorType =
  | "dependency"
  | "file_pattern"
  | "code_pattern"
  | "config_file";

export interface DetectionIndicator {
  type: DetectionIndicatorType;
  pattern: string;
  weight: number;
  required?: boolean;
  matched?: boolean;
}

export interface ReasoningPattern {
  name: string;
  description: string;
  guidance: string;
  examples?: string[];
}

export interface FrameworkCapability {
  category:
    | "ui"
    | "backend"
    | "database"
    | "state_management"
    | "routing"
    | "testing";
  features: string[];
  patterns: ReasoningPattern[];
}

export interface FrameworkSignature {
  name: string;
  version?: string;
  confidence: number;
  indicators: DetectionIndicator[];
  capabilities: FrameworkCapability[];
  summary: string;
}

export interface PackageInfo {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  packageJsonPath?: string;
}

export interface FileNode {
  path: string;
  isDirectory: boolean;
}

export interface CodePattern {
  identifier: string;
  matchedPaths: string[];
}

export interface DetectionContext {
  packageInfo: PackageInfo;
  fileStructure: FileNode[];
  codePatterns: CodePattern[];
  workspacePath: string;
}

export interface DetectionResult extends DetectionIndicator {
  matched: boolean;
}

export interface FrameworkDetectionOptions {
  workspacePath: string;
  includeCodePatterns?: boolean;
  includeFileStructure?: boolean;
  signal?: AbortSignal;
}

export interface FrameworkInsight {
  signatures: FrameworkSignature[];
  reasoningHighlights: string[];
  recommendedPatterns: ReasoningPattern[];
}
