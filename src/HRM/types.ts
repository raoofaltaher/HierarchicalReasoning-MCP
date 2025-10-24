import { z } from "zod";
import type { FrameworkInsight } from "./frameworks/index.js";

export const HIERARCHICAL_OPERATIONS = [
  "h_plan",
  "l_execute",
  "h_update",
  "evaluate",
  "halt_check",
  "auto_reason",
] as const;

export const HRMParametersSchema = z.object({
  operation: z.enum(HIERARCHICAL_OPERATIONS),
  h_thought: z.string().optional(),
  l_thought: z.string().optional(),
  problem: z.string().optional(),
  h_cycle: z.number().int().nonnegative().default(0),
  l_cycle: z.number().int().nonnegative().default(0),
  max_l_cycles_per_h: z.number().int().positive().max(20).default(3),
  max_h_cycles: z.number().int().positive().max(20).default(4),
  confidence_score: z.number().min(0).max(1).optional(),
  complexity_estimate: z.number().min(1).max(10).optional(),
  convergence_threshold: z.number().min(0.5).max(0.99).optional(),
  h_context: z.string().optional(),
  l_context: z.string().optional(),
  solution_candidates: z.array(z.string()).optional(),
  session_id: z.string().uuid().optional(),
  reset_state: z.boolean().optional(),
  workspace_path: z.string().optional(),
});

export type HRMParameters = z.infer<typeof HRMParametersSchema>;
export type HRMOperation = (typeof HIERARCHICAL_OPERATIONS)[number];

export interface ReasoningMetrics {
  confidenceScore: number;
  complexityAssessment: number;
  shouldContinue: boolean;
  convergenceScore: number;
}

export type HaltTrigger = "confidence_convergence" | "plateau" | "max_steps";

export interface PerformanceMetrics {
  // Cycle durations (milliseconds)
  totalDuration?: number; // Total operation/auto_reason time
  cycleDurations: number[]; // Array of individual cycle times
  avgCycleDuration: number; // Mean cycle duration

  // Thought lengths (characters)
  hThoughtLengths: number[]; // Array of h_thought lengths
  lThoughtLengths: number[]; // Array of l_thought lengths
  avgHThoughtLength: number; // Mean h_thought length
  avgLThoughtLength: number; // Mean l_thought length

  // Context retention ratio (growth rate)
  contextGrowthRatios: number[]; // Context size delta per cycle
  avgContextGrowth: number; // Mean growth ratio

  // Cycle counts
  totalCycles: number; // Total H+L cycles executed
}

export interface HierarchicalState {
  sessionId: string;
  hCycle: number;
  lCycle: number;
  maxLCyclesPerH: number;
  maxHCycles: number;
  hContext: string[];
  lContext: string[];
  solutionCandidates: string[];
  convergenceThreshold: number;
  metrics: ReasoningMetrics;
  lastUpdated: number;
  recentDecisions: string[];
  pendingActions: HRMOperation[];
  autoMode: boolean;
  problem?: string;
  complexityEstimate: number;
  workspacePath?: string;
  frameworkInsight?: FrameworkInsight;
  frameworkNotes: string[];
  metricHistory: number[];
  plateauCount: number;
  recentLThoughtHashes: string[];
  performanceMetrics?: PerformanceMetrics; // Optional: timing & thought length tracking
}

export interface HRMResponseContent {
  type: string;
  text: string;
}

export interface HRMResponse {
  content: HRMResponseContent[];
  current_state: {
    h_cycle: number;
    l_cycle: number;
    h_context: string;
    l_context: string;
    operation_performed: HRMOperation;
    convergence_status: "converging" | "converged" | "diverging";
  };
  reasoning_metrics: ReasoningMetrics;
  suggested_next_operation?: HRMOperation;
  session_id: string;
  trace?: AutoReasoningTraceEntry[];
  halt_trigger?: HaltTrigger;
  isError?: boolean;
  error_message?: string;
  diagnostics?: {
    plateau_count: number;
    confidence_window: number[];
    performance?: PerformanceMetrics; // Optional: performance tracking data
  };
}

export interface AutoReasoningTraceEntry {
  step: number;
  operation: HRMOperation;
  hCycle: number;
  lCycle: number;
  note: string;
  metrics: ReasoningMetrics;
}
