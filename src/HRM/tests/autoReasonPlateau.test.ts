import { describe, it, expect } from "vitest";
import { HierarchicalReasoningEngine } from "../engine.js";
import { HRMParameters } from "../types.js";

// This test simulates auto reasoning halting by max steps or plateau by constraining thresholds tightly.
// NOTE: Plateau detection relies on internal metric history; we approximate by forcing convergence threshold very low
// so it quickly considers itself converged, then halt_check should trigger a halt.

function buildParams(overrides: Partial<HRMParameters>): HRMParameters {
  return {
    operation: "auto_reason",
    h_cycle: 0,
    l_cycle: 0,
    max_l_cycles_per_h: 2,
    max_h_cycles: 2,
    convergence_threshold: 0.55, // permissive to converge early
    ...overrides,
  } as HRMParameters; // test-focused cast
}

describe("auto_reason plateau / convergence halt", () => {
  it("should eventually produce a halt_trigger", async () => {
    const engine = new HierarchicalReasoningEngine();
    const response = await engine.handleRequest(
      buildParams({ problem: "Test early convergence", session_id: undefined })
    );
    expect(response.halt_trigger).toBeDefined();
    expect(["confidence_convergence", "plateau", "max_steps"]).toContain(
      response.halt_trigger
    );
    expect(response.trace && response.trace.length).toBeGreaterThan(0);
  });
});
