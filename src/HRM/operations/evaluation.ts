import {
  MAX_PLATEAU_BEFORE_HALT,
  MIN_CONFIDENCE_FOR_COMPLETION,
  MIN_CONVERGENCE_FOR_COMPLETION,
  PLATEAU_DELTA,
  PLATEAU_WINDOW,
} from "../constants.js";
import { computeReasoningMetrics } from "../utils/metrics.js";
import { log } from "../utils/logging.js";
import { HierarchicalState, HRMParameters, ReasoningMetrics } from "../types.js";

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
  if (state.metricHistory.length > PLATEAU_WINDOW) {
    state.metricHistory.shift();
  }

  if (state.metricHistory.length >= PLATEAU_WINDOW) {
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
} => {
  const { confidenceScore, convergenceScore } = state.metrics;
  const confidenceReady = confidenceScore >= MIN_CONFIDENCE_FOR_COMPLETION;
  const convergenceReady =
    convergenceScore >= Math.max(MIN_CONVERGENCE_FOR_COMPLETION, state.convergenceThreshold);
  const plateauReady = (state.plateauCount ?? 0) >= MAX_PLATEAU_BEFORE_HALT;
  const shouldHalt = (confidenceReady && convergenceReady) || plateauReady;
  const rationale = plateauReady
    ? `Halting due to confidence plateau (Δ < ${PLATEAU_DELTA} across ${PLATEAU_WINDOW} evaluations).`
    : shouldHalt
      ? "Conditions met for halting"
      : `Continue reasoning: confidence ${confidenceScore.toFixed(2)}, convergence ${convergenceScore.toFixed(2)}`;
  log("info", "Halt check evaluated", { sessionId: state.sessionId, shouldHalt, rationale });
  return { shouldHalt, rationale };
};

