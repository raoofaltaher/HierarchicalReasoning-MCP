import { HRMOperation, ReasoningMetrics } from "./types.js";

export const DEFAULT_MAX_L_CYCLES_PER_H = 3;
export const DEFAULT_MAX_H_CYCLES = 4;
export const DEFAULT_CONVERGENCE_THRESHOLD = 0.85;
export const DEFAULT_COMPLEXITY_ESTIMATE = 5;
export const MAX_RECENT_DECISIONS = 12;
export const MAX_PENDING_ACTIONS = 6;
export const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000;

export const OPERATION_PRIORITIES: Record<HRMOperation, number> = {
  h_plan: 1,
  l_execute: 2,
  h_update: 3,
  evaluate: 4,
  halt_check: 5,
  auto_reason: 0,
};

export const INITIAL_METRICS: ReasoningMetrics = {
  confidenceScore: 0.2,
  complexityAssessment: DEFAULT_COMPLEXITY_ESTIMATE,
  shouldContinue: true,
  convergenceScore: 0.1,
};

export const MAX_CONTEXT_LENGTH = 2000;
export const MAX_THOUGHT_LENGTH = 2000;

export const MIN_CONFIDENCE_FOR_COMPLETION = 0.8;
export const MIN_CONVERGENCE_FOR_COMPLETION = 0.85;
export const MAX_AUTO_REASONING_STEPS = 24;

export const PLATEAU_WINDOW = 3;
export const PLATEAU_DELTA = 0.02;
export const MAX_PLATEAU_BEFORE_HALT = 2;

export const LOG_PREFIX = "[HRM]";

export const AUTO_REASONING_OPERATIONS: HRMOperation[] = [
  "h_plan",
  "l_execute",
  "evaluate",
  "halt_check",
];

export const PROBLEM_SUMMARY_TEMPLATE = `Provide a concise summary of the problem, key constraints, and desired outcomes.`;

export const LAYER_ROLE_DESCRIPTIONS: Record<Exclude<HRMOperation, "auto_reason">, string> = {
  h_plan: "High-level planning to outline strategic direction",
  l_execute: "Low-level execution handling details and implementation",
  h_update: "High-level synthesis of low-level outcomes",
  evaluate: "Evaluation of solution quality and alignment",
  halt_check: "Halting check to decide continuation",
};
