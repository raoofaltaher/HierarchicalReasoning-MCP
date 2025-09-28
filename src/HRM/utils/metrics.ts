import {
  MIN_CONFIDENCE_FOR_COMPLETION,
  MIN_CONVERGENCE_FOR_COMPLETION,
} from "../constants.js";
import { HierarchicalState, ReasoningMetrics } from "../types.js";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const weightedAverage = (values: Array<{ value: number; weight: number }>) => {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) {
    return 0;
  }
  const weightedSum = values.reduce((sum, item) => sum + item.value * item.weight, 0);
  return weightedSum / totalWeight;
};

const textDensityScore = (entries: string[]) => {
  if (!entries.length) {
    return 0;
  }
  const totalLength = entries.reduce((sum, item) => sum + item.length, 0);
  const avgLength = totalLength / entries.length;
  return clamp(avgLength / 400, 0, 1);
};

const diversityScore = (entries: string[]) => {
  if (entries.length <= 1) {
    return entries.length === 1 ? 0.2 : 0;
  }
  const uniqueTokens = new Set(entries.flatMap((entry) => entry.split(/\W+/))); // rough coverage check
  return clamp(uniqueTokens.size / (entries.join(" ").split(/\W+/).length + 1), 0, 1);
};

export const computeReasoningMetrics = (state: HierarchicalState): ReasoningMetrics => {
  const highLevelCoverage = textDensityScore(state.hContext);
  const lowLevelDepth = textDensityScore(state.lContext);
  const candidateStrength = clamp(state.solutionCandidates.length / 5, 0, 1);

  const convergenceScore = clamp(
    weightedAverage([
      { value: highLevelCoverage, weight: 0.35 },
      { value: lowLevelDepth, weight: 0.35 },
      { value: candidateStrength, weight: 0.2 },
      { value: diversityScore(state.hContext), weight: 0.1 },
    ]),
    0,
    1,
  );

  const complexityPenalty = clamp(state.complexityEstimate / 10, 0.1, 1);
  const momentum = clamp(state.recentDecisions.length / 10, 0, 1);

  const confidenceScore = clamp(
    weightedAverage([
      { value: convergenceScore, weight: 0.45 },
      { value: candidateStrength, weight: 0.25 },
      { value: 1 - complexityPenalty, weight: 0.15 },
      { value: momentum, weight: 0.15 },
    ]),
    0,
    1,
  );

  const shouldContinue =
    confidenceScore < MIN_CONFIDENCE_FOR_COMPLETION ||
    convergenceScore < Math.max(MIN_CONVERGENCE_FOR_COMPLETION, state.convergenceThreshold);

  return {
    confidenceScore,
    convergenceScore,
    complexityAssessment: state.complexityEstimate,
    shouldContinue,
  };
};