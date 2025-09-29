import {
  DEFAULT_COMPLEXITY_ESTIMATE,
  DEFAULT_CONVERGENCE_THRESHOLD,
  DEFAULT_MAX_H_CYCLES,
  DEFAULT_MAX_L_CYCLES_PER_H,
  INITIAL_METRICS,
} from "../constants.js";
import {
  HRMParametersSchema,
  type HierarchicalState,
  type HRMParameters,
} from "../types.js";

export const createState = (overrides: Partial<HierarchicalState> = {}): HierarchicalState => ({
  sessionId: overrides.sessionId ?? "session-test",
  hCycle: overrides.hCycle ?? 0,
  lCycle: overrides.lCycle ?? 0,
  maxLCyclesPerH: overrides.maxLCyclesPerH ?? DEFAULT_MAX_L_CYCLES_PER_H,
  maxHCycles: overrides.maxHCycles ?? DEFAULT_MAX_H_CYCLES,
  hContext: overrides.hContext ? [...overrides.hContext] : [],
  lContext: overrides.lContext ? [...overrides.lContext] : [],
  solutionCandidates: overrides.solutionCandidates ? [...overrides.solutionCandidates] : [],
  convergenceThreshold: overrides.convergenceThreshold ?? DEFAULT_CONVERGENCE_THRESHOLD,
  metrics: overrides.metrics ? { ...overrides.metrics } : { ...INITIAL_METRICS },
  lastUpdated: overrides.lastUpdated ?? Date.now(),
  recentDecisions: overrides.recentDecisions ? [...overrides.recentDecisions] : [],
  pendingActions: overrides.pendingActions ? [...overrides.pendingActions] : [],
  autoMode: overrides.autoMode ?? false,
  problem: overrides.problem,
  complexityEstimate: overrides.complexityEstimate ?? DEFAULT_COMPLEXITY_ESTIMATE,
  workspacePath: overrides.workspacePath,
  frameworkInsight: overrides.frameworkInsight,
  frameworkNotes: overrides.frameworkNotes ? [...overrides.frameworkNotes] : [],
  metricHistory: overrides.metricHistory ? [...overrides.metricHistory] : [],
  plateauCount: overrides.plateauCount ?? 0,
  recentLThoughtHashes: overrides.recentLThoughtHashes ? [...overrides.recentLThoughtHashes] : [],
});

export const createParams = (overrides: Partial<HRMParameters> = {}): HRMParameters =>
  HRMParametersSchema.parse({
    operation: "h_plan",
    ...overrides,
  });
