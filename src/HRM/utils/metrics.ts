import {
  MIN_CONFIDENCE_FOR_COMPLETION,
  MIN_CONVERGENCE_FOR_COMPLETION,
} from "../constants.js";
import { HierarchicalState, ReasoningMetrics } from "../types.js";

/**
 * Convergence scoring weights - determine how different factors contribute to overall convergence.
 * Total weight should sum to 1.0 for proper normalization.
 */
export const CONVERGENCE_WEIGHTS = {
  /** Weight for high-level strategic planning coverage (0.35 = 35%) */
  HIGH_LEVEL_COVERAGE: 0.35, // Emphasis on strategic thinking depth and breadth
  /** Weight for low-level tactical execution detail (0.35 = 35%) */
  LOW_LEVEL_DEPTH: 0.35, // Equal emphasis on implementation detail quality
  /** Weight for solution candidate quality and quantity (0.2 = 20%) */
  CANDIDATE_STRENGTH: 0.2, // Indicator of concrete solution readiness
  /** Weight for thought diversity to avoid repetition (0.1 = 10%) */
  DIVERSITY: 0.1, // Bonus for broad coverage, penalty for narrow focus
} as const;

/**
 * Confidence scoring weights - assess overall reasoning confidence and readiness.
 * Combines convergence with momentum and complexity factors.
 */
export const CONFIDENCE_WEIGHTS = {
  /** Weight for convergence score (0.45 = 45%) - primary driver */
  CONVERGENCE: 0.45, // Convergence is the strongest signal of completion readiness
  /** Weight for solution candidate strength (0.25 = 25%) */
  CANDIDATE_STRENGTH: 0.25, // Direct measure of solution quality
  /** Weight for complexity penalty (0.15 = 15%) */
  COMPLEXITY_PENALTY: 0.15, // Harder problems need more work before confidence rises
  /** Weight for reasoning momentum (0.15 = 15%) */
  MOMENTUM: 0.15, // Active reasoning increases confidence vs stagnation
} as const;

/**
 * Scoring constants for candidate evaluation.
 */
export const CANDIDATE_SCORING = {
  /** Number of candidates needed to reach maximum strength score */
  SATURATION_THRESHOLD: 5, // 5+ candidates = 100% strength score
  /** Diversity score for single context entry */
  SINGLE_ENTRY_DIVERSITY: 0.2,
  /** Average text length target for density scoring */
  TARGET_TEXT_LENGTH: 400, // Characters per context entry for optimal density
} as const;

/**
 * Momentum and complexity scoring constants.
 */
export const REASONING_DYNAMICS = {
  /** Number of recent decisions needed for maximum momentum */
  MOMENTUM_SATURATION: 10,
  /** Maximum complexity estimate value */
  MAX_COMPLEXITY: 10,
  /** Minimum complexity penalty to avoid division issues */
  MIN_COMPLEXITY_PENALTY: 0.1,
} as const;

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
  return clamp(avgLength / CANDIDATE_SCORING.TARGET_TEXT_LENGTH, 0, 1);
};

const diversityScore = (entries: string[]) => {
  if (entries.length <= 1) {
    return entries.length === 1 ? CANDIDATE_SCORING.SINGLE_ENTRY_DIVERSITY : 0;
  }
  const uniqueTokens = new Set(entries.flatMap((entry) => entry.split(/\W+/))); // rough coverage check
  return clamp(uniqueTokens.size / (entries.join(" ").split(/\W+/).length + 1), 0, 1);
};

export const computeReasoningMetrics = (state: HierarchicalState): ReasoningMetrics => {
  const highLevelCoverage = textDensityScore(state.hContext);
  const lowLevelDepth = textDensityScore(state.lContext);
  const candidateStrength = clamp(
    state.solutionCandidates.length / CANDIDATE_SCORING.SATURATION_THRESHOLD,
    0,
    1,
  );

  const convergenceScore = clamp(
    weightedAverage([
      { value: highLevelCoverage, weight: CONVERGENCE_WEIGHTS.HIGH_LEVEL_COVERAGE },
      { value: lowLevelDepth, weight: CONVERGENCE_WEIGHTS.LOW_LEVEL_DEPTH },
      { value: candidateStrength, weight: CONVERGENCE_WEIGHTS.CANDIDATE_STRENGTH },
      { value: diversityScore(state.hContext), weight: CONVERGENCE_WEIGHTS.DIVERSITY },
    ]),
    0,
    1,
  );

  const complexityPenalty = clamp(
    state.complexityEstimate / REASONING_DYNAMICS.MAX_COMPLEXITY,
    REASONING_DYNAMICS.MIN_COMPLEXITY_PENALTY,
    1,
  );
  const momentum = clamp(
    state.recentDecisions.length / REASONING_DYNAMICS.MOMENTUM_SATURATION,
    0,
    1,
  );

  const confidenceScore = clamp(
    weightedAverage([
      { value: convergenceScore, weight: CONFIDENCE_WEIGHTS.CONVERGENCE },
      { value: candidateStrength, weight: CONFIDENCE_WEIGHTS.CANDIDATE_STRENGTH },
      { value: 1 - complexityPenalty, weight: CONFIDENCE_WEIGHTS.COMPLEXITY_PENALTY },
      { value: momentum, weight: CONFIDENCE_WEIGHTS.MOMENTUM },
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