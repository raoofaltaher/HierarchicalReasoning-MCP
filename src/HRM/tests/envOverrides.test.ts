import { afterEach, describe, expect, it, vi } from "vitest";
import { createParams } from "./helpers.js";
import type { HierarchicalState } from "../types.js";

const accessSession = async (engine: unknown, sessionId: string): Promise<HierarchicalState> =>
  await (engine as unknown as { sessions: { getState: (id: string) => Promise<HierarchicalState> } }).sessions.getState(
    sessionId,
  );

afterEach(() => {
  delete process.env.HRM_CONVERGENCE_THRESHOLD;
  delete process.env.HRM_CONFIDENCE_THRESHOLD;
  vi.resetModules();
});

describe("environment overrides", () => {
  it("halts once the lowered convergence threshold is satisfied", async () => {
    vi.resetModules();
    let { HierarchicalReasoningEngine } = await import("../engine.js");
    let { handleHaltCheck } = await import("../operations/evaluation.js");

    const engineDefault = new HierarchicalReasoningEngine();
    const defaultResponse = await engineDefault.handleRequest(createParams({ operation: "h_plan" }));
    const defaultSession = await accessSession(engineDefault, defaultResponse.session_id);
    expect(defaultSession).toBeDefined();

    defaultSession.metrics.confidenceScore = 0.82;
    defaultSession.metrics.convergenceScore = 0.75;

    const defaultOutcome = handleHaltCheck(defaultSession);
    expect(defaultSession.convergenceThreshold).toBeCloseTo(0.85);
    expect(defaultOutcome.shouldHalt).toBe(false);

    process.env.HRM_CONVERGENCE_THRESHOLD = "0.7";
    vi.resetModules();
    ({ HierarchicalReasoningEngine } = await import("../engine.js"));
    ({ handleHaltCheck } = await import("../operations/evaluation.js"));

    const engineOverride = new HierarchicalReasoningEngine();
    const overrideResponse = await engineOverride.handleRequest(createParams({ operation: "h_plan" }));
    const overrideSession = await accessSession(engineOverride, overrideResponse.session_id);
    expect(overrideSession).toBeDefined();

    overrideSession.metrics.confidenceScore = 0.82;
    overrideSession.metrics.convergenceScore = 0.75;

    const overrideOutcome = handleHaltCheck(overrideSession);

    expect(overrideSession.convergenceThreshold).toBeCloseTo(0.7);
    expect(overrideOutcome.shouldHalt).toBe(true);
    expect(overrideOutcome.trigger).toBe("confidence_convergence");
  });
});
