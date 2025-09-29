import { describe, expect, it } from "vitest";
import { computeReasoningMetrics } from "../utils/metrics.js";
import { createState } from "./helpers.js";

const buildState = (overrides: Parameters<typeof createState>[0]) => createState(overrides);

describe("computeReasoningMetrics", () => {
  it("clamps candidate strength once five or more candidates are present", () => {
    const baseContext = ["Outline high level", "Plan execution steps"];
    const stateWithFive = buildState({
      hContext: baseContext,
      lContext: ["detail"],
      solutionCandidates: ["A", "B", "C", "D", "E"],
    });
    const stateWithTen = buildState({
      hContext: baseContext,
      lContext: ["detail"],
      solutionCandidates: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    });

    const metricsFive = computeReasoningMetrics(stateWithFive);
    const metricsTen = computeReasoningMetrics(stateWithTen);

    expect(metricsTen.convergenceScore).toBeCloseTo(metricsFive.convergenceScore, 5);
    expect(metricsTen.confidenceScore).toBeCloseTo(metricsFive.confidenceScore, 5);
  });

  it("handles diversity edge cases from empty to varied contexts", () => {
    const emptyState = buildState({ hContext: [], lContext: [] });
    const singleState = buildState({ hContext: ["repeat repeat"], lContext: [] });
    const diverseState = buildState({
      hContext: [
        "plan feature integration",
        "audit state management hooks",
        "evaluate rendering patterns",
      ],
      lContext: [],
    });

    const emptyMetrics = computeReasoningMetrics(emptyState);
    const singleMetrics = computeReasoningMetrics(singleState);
    const diverseMetrics = computeReasoningMetrics(diverseState);

    expect(emptyMetrics.convergenceScore).toBeGreaterThanOrEqual(0);
    expect(singleMetrics.convergenceScore).toBeGreaterThan(emptyMetrics.convergenceScore);
    expect(diverseMetrics.convergenceScore).toBeGreaterThan(singleMetrics.convergenceScore);
  });
});
