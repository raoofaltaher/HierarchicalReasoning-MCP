import {
  MAX_PLATEAU_BEFORE_HALT,
  MIN_CONFIDENCE_FOR_COMPLETION,
  MIN_CONVERGENCE_FOR_COMPLETION,
  PLATEAU_DELTA,
  PLATEAU_WINDOW,
} from "../constants.js";
import { computeReasoningMetrics } from "../utils/metrics.js";
import { log } from "../utils/logging.js";
import { HaltTrigger, HierarchicalState, HRMParameters, ReasoningMetrics } from "../types.js";

// Runtime-adjustable plateau window via environment variable HRM_PLATEAU_WINDOW (2..20)
const plateauWindow: number = (() => {
  const raw = process.env.HRM_PLATEAU_WINDOW;
  if (!raw) return PLATEAU_WINDOW;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) return PLATEAU_WINDOW;
  return Math.min(20, Math.max(2, parsed));
})();

export const handleEvaluate = (state: HierarchicalState, params: HRMParameters): ReasoningMetrics => {
  if (typeof params.confidence_score === "number") {
    state.metrics.confidenceScore = params.confidence_score;
  }
  if (typeof params.complexity_estimate === "number") {
    state.complexityEstimate = params.complexity_estimate;
  }
  const metrics = computeReasoningMetrics(state);
  state.metrics = metrics;

  state.metricHistory = state.metricHistory ?? [];
  state.metricHistory.push(metrics.confidenceScore);
  if (state.metricHistory.length > plateauWindow) {
    state.metricHistory.shift();
  }

  if (state.metricHistory.length >= plateauWindow) {
    const first = state.metricHistory[0];
    const last = state.metricHistory[state.metricHistory.length - 1];
    const improvement = last - first;
    if (improvement < PLATEAU_DELTA) {
      state.plateauCount = (state.plateauCount ?? 0) + 1;
    } else {
      state.plateauCount = 0;
    }
  } else {
    state.plateauCount = 0;
  }

  log("info", "Evaluation complete", {
    sessionId: state.sessionId,
    metrics,
  });
  return metrics;
};

export const handleHaltCheck = (state: HierarchicalState): {
  shouldHalt: boolean;
  rationale: string;
  trigger?: HaltTrigger;
} => {
  const { confidenceScore, convergenceScore } = state.metrics;
  const confidenceReady = confidenceScore >= MIN_CONFIDENCE_FOR_COMPLETION;
  const convergenceReady =
    convergenceScore >= Math.max(MIN_CONVERGENCE_FOR_COMPLETION, state.convergenceThreshold);
  const plateauReady = (state.plateauCount ?? 0) >= MAX_PLATEAU_BEFORE_HALT;
  const shouldHalt = (confidenceReady && convergenceReady) || plateauReady;
  let trigger: HaltTrigger | undefined;
  if (plateauReady) {
    trigger = "plateau";
  } else if (confidenceReady && convergenceReady) {
    trigger = "confidence_convergence";
  }
  const rationale = plateauReady
    ? `Halting due to confidence plateau (Δ < ${PLATEAU_DELTA} across ${plateauWindow} evaluations).`
    : shouldHalt
      ? "Conditions met for halting"
      : `Continue reasoning: confidence ${confidenceScore.toFixed(2)}, convergence ${convergenceScore.toFixed(2)}`;
  log("info", "Halt check evaluated", { sessionId: state.sessionId, shouldHalt, rationale });
  return { shouldHalt, rationale, trigger };
};

