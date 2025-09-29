import { describe, it, expect } from "vitest";

import { MAX_PLATEAU_BEFORE_HALT, MIN_CONFIDENCE_FOR_COMPLETION } from "../constants.js";
import { handleHaltCheck } from "../operations/evaluation.js";
import type { ReasoningMetrics } from "../types.js";
import { createState } from "./helpers.js";

describe("handleHaltCheck", () => {
  it("halts when confidence and convergence meet thresholds", () => {
    const metrics: ReasoningMetrics = {
      confidenceScore: MIN_CONFIDENCE_FOR_COMPLETION + 0.05,
      convergenceScore: 0.9,
      shouldContinue: false,
      complexityAssessment: 5,
    };
    const state = createState({ metrics, convergenceThreshold: 0.85 });

    const result = handleHaltCheck(state);

    expect(result.shouldHalt).toBe(true);
    expect(result.trigger).toBe("confidence_convergence");
    expect(result.rationale).toContain("Conditions met");
  });

  it("halts when plateau persists across evaluations", () => {
    const state = createState({
      metrics: {
        confidenceScore: 0.5,
        convergenceScore: 0.5,
        shouldContinue: true,
        complexityAssessment: 5,
      },
      plateauCount: MAX_PLATEAU_BEFORE_HALT,
    });

    const result = handleHaltCheck(state);

    expect(result.shouldHalt).toBe(true);
    expect(result.trigger).toBe("plateau");
    expect(result.rationale).toContain("plateau");
  });

  it("continues when thresholds are not met", () => {
    const state = createState({
      metrics: {
        confidenceScore: 0.4,
        convergenceScore: 0.4,
        shouldContinue: true,
        complexityAssessment: 5,
      },
    });

    const result = handleHaltCheck(state);

    expect(result.shouldHalt).toBe(false);
    expect(result.trigger).toBeUndefined();
    expect(result.rationale).toContain("Continue reasoning");
  });
});
