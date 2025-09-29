import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_PLATEAU_BEFORE_HALT, PLATEAU_DELTA, PLATEAU_WINDOW } from "../constants.js";
import { createParams, createState } from "./helpers.js";

const DEFAULT_COMPLEXITY = 5;

afterEach(() => {
  delete process.env.HRM_PLATEAU_WINDOW;
  delete process.env.HRM_PLATEAU_DELTA;
  vi.resetModules();
});

describe("plateau detection", () => {
  it("halts when confidence improvements remain below the plateau delta", async () => {
    const { handleEvaluate, handleHaltCheck } = await import("../operations/evaluation.js");
    const state = createState({
      hContext: ["Outline integration plan"],
      lContext: ["Detail steps"],
    });

    for (let idx = 0; idx < PLATEAU_WINDOW + MAX_PLATEAU_BEFORE_HALT; idx += 1) {
      const params = createParams({
        operation: "evaluate",
        complexity_estimate: DEFAULT_COMPLEXITY - idx * 0.1,
      });
      await handleEvaluate(state, params);
    }

    expect(state.metricHistory).toHaveLength(PLATEAU_WINDOW);
    expect(state.plateauCount).toBeGreaterThanOrEqual(MAX_PLATEAU_BEFORE_HALT);

    const haltOutcome = handleHaltCheck(state);
    expect(haltOutcome.shouldHalt).toBe(true);
    expect(haltOutcome.trigger).toBe("plateau");
    expect(haltOutcome.rationale).toContain(`Δ < ${PLATEAU_DELTA}`);
    expect(haltOutcome.rationale).toContain(`across ${PLATEAU_WINDOW} evaluations`);
  });

  it("respects HRM_PLATEAU_WINDOW overrides", async () => {
    process.env.HRM_PLATEAU_WINDOW = "5";
    const { handleEvaluate, handleHaltCheck } = await import("../operations/evaluation.js");

    const state = createState({
      hContext: ["Summarize learnings"],
      lContext: ["Record evidence"],
    });

    const overrideWindow = 5;
    for (let idx = 0; idx < overrideWindow + MAX_PLATEAU_BEFORE_HALT; idx += 1) {
      const params = createParams({
        operation: "evaluate",
        complexity_estimate: DEFAULT_COMPLEXITY - idx * 0.1,
      });
      await handleEvaluate(state, params);
    }

    expect(state.metricHistory).toHaveLength(overrideWindow);
    expect(state.plateauCount).toBeGreaterThanOrEqual(MAX_PLATEAU_BEFORE_HALT);

    const haltOutcome = handleHaltCheck(state);
    expect(haltOutcome.shouldHalt).toBe(true);
    expect(haltOutcome.trigger).toBe("plateau");
    expect(haltOutcome.rationale).toContain("across 5 evaluations");
  });

  it("surfaces HRM_PLATEAU_DELTA overrides in halt rationale", async () => {
    process.env.HRM_PLATEAU_DELTA = "0.05";
    const { handleEvaluate, handleHaltCheck } = await import("../operations/evaluation.js");

    const state = createState({
      hContext: ["Investigate plateau behavior"],
      lContext: ["Collect metrics"],
    });

    for (let idx = 0; idx < PLATEAU_WINDOW + MAX_PLATEAU_BEFORE_HALT; idx += 1) {
      const params = createParams({ operation: "evaluate" });
      await handleEvaluate(state, params);
    }

    const haltOutcome = handleHaltCheck(state);
    expect(haltOutcome.shouldHalt).toBe(true);
    expect(haltOutcome.rationale).toContain("Δ < 0.05");
  });
});
