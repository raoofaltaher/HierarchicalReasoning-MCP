import { describe, it, expect, beforeEach } from "vitest";
import { randomUUID } from "crypto";
import { HierarchicalReasoningEngine } from "../engine.js";
import { createParams } from "./helpers.js";

describe("Performance Metrics", () => {
  let engine: HierarchicalReasoningEngine;

  beforeEach(() => {
    engine = new HierarchicalReasoningEngine();
  });

  it("should track cycle durations across operations", async () => {
    const params = createParams({
      operation: "h_plan",
      problem: "Test problem",
      h_thought: "Initial high-level plan",
    });

    const response = await engine.handleRequest(params);
    
    expect(response.diagnostics?.performance).toBeDefined();
    expect(response.diagnostics?.performance?.cycleDurations).toBeDefined();
    expect(response.diagnostics?.performance?.cycleDurations.length).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.totalCycles).toBeGreaterThan(0);
  });

  it("should track thought lengths for H and L layers", async () => {
    const sessionId = randomUUID();
    
    // H-layer thought
    const hPlanParams = createParams({
      operation: "h_plan",
      session_id: sessionId,
      problem: "Complex problem",
      h_thought: "This is a detailed high-level strategic thought that spans multiple ideas and concepts.",
    });
    
    await engine.handleRequest(hPlanParams);
    
    // L-layer thought
    const lExecuteParams = createParams({
      operation: "l_execute",
      session_id: sessionId,
      l_thought: "This is a shorter low-level execution step.",
    });
    
    const response = await engine.handleRequest(lExecuteParams);
    
    expect(response.diagnostics?.performance).toBeDefined();
    expect(response.diagnostics?.performance?.hThoughtLengths.length).toBe(1);
    expect(response.diagnostics?.performance?.lThoughtLengths.length).toBe(1);
    expect(response.diagnostics?.performance?.hThoughtLengths[0]).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.lThoughtLengths[0]).toBeGreaterThan(0);
  });

  it("should calculate average cycle duration correctly", async () => {
    const sessionId = randomUUID();
    
    // Perform multiple operations
    await engine.handleRequest(createParams({
      operation: "h_plan",
      session_id: sessionId,
      problem: "Test",
      h_thought: "Plan 1",
    }));
    
    await engine.handleRequest(createParams({
      operation: "l_execute",
      session_id: sessionId,
      l_thought: "Execute 1",
    }));
    
    const response = await engine.handleRequest(createParams({
      operation: "evaluate",
      session_id: sessionId,
    }));
    
    expect(response.diagnostics?.performance?.avgCycleDuration).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.cycleDurations.length).toBe(3);
    
    // Verify average calculation
    const durations = response.diagnostics!.performance!.cycleDurations;
    const expectedAvg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    expect(response.diagnostics?.performance?.avgCycleDuration).toBeCloseTo(expectedAvg, 5);
  });

  it("should calculate average thought lengths correctly", async () => {
    const sessionId = randomUUID();
    
    await engine.handleRequest(createParams({
      operation: "h_plan",
      session_id: sessionId,
      problem: "Test",
      h_thought: "Short",
    }));
    
    await engine.handleRequest(createParams({
      operation: "h_update",
      session_id: sessionId,
      h_thought: "This is a much longer high-level thought with more content and details.",
    }));
    
    const response = await engine.handleRequest(createParams({
      operation: "evaluate",
      session_id: sessionId,
    }));
    
    expect(response.diagnostics?.performance?.avgHThoughtLength).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.hThoughtLengths.length).toBe(2);
    
    // Verify average calculation
    const lengths = response.diagnostics!.performance!.hThoughtLengths;
    const expectedAvg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    expect(response.diagnostics?.performance?.avgHThoughtLength).toBeCloseTo(expectedAvg, 5);
  });

  it("should track context growth ratios", async () => {
    const sessionId = randomUUID();
    
    await engine.handleRequest(createParams({
      operation: "h_plan",
      session_id: sessionId,
      problem: "Test",
      h_thought: "Initial small context",
    }));
    
    await engine.handleRequest(createParams({
      operation: "h_update",
      session_id: sessionId,
      h_thought: "Adding significantly more content to the context to increase its size substantially and observe growth patterns.",
    }));
    
    const response = await engine.handleRequest(createParams({
      operation: "evaluate",
      session_id: sessionId,
    }));
    
    expect(response.diagnostics?.performance?.contextGrowthRatios).toBeDefined();
    expect(response.diagnostics?.performance?.contextGrowthRatios.length).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.avgContextGrowth).toBeGreaterThan(0);
  });

  it("should include performance metrics in auto_reason response", async () => {
    const response = await engine.handleRequest(createParams({
      operation: "auto_reason",
      problem: "Design a simple component",
      max_h_cycles: 2,
      max_l_cycles_per_h: 2,
    }));
    
    expect(response.diagnostics?.performance).toBeDefined();
    expect(response.diagnostics?.performance?.totalCycles).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.cycleDurations.length).toBeGreaterThan(0);
    expect(response.diagnostics?.performance?.avgCycleDuration).toBeGreaterThan(0);
    
    // Verify all metrics are calculated
    expect(response.diagnostics?.performance?.avgHThoughtLength).toBeGreaterThanOrEqual(0);
    expect(response.diagnostics?.performance?.avgLThoughtLength).toBeGreaterThanOrEqual(0);
    expect(response.diagnostics?.performance?.avgContextGrowth).toBeGreaterThanOrEqual(0);
  });

  it("should handle edge case of empty arrays safely", async () => {
    const params = createParams({
      operation: "evaluate",
      problem: "Test",
    });
    
    const response = await engine.handleRequest(params);
    
    // Even with minimal operations, should have at least evaluate's cycle
    expect(response.diagnostics?.performance).toBeDefined();
    expect(response.diagnostics?.performance?.cycleDurations.length).toBe(1);
    
    // Averages should be 0 or valid numbers, not NaN
    const perf = response.diagnostics!.performance!;
    expect(perf.avgCycleDuration).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(perf.avgHThoughtLength)).toBe(true);
    expect(Number.isFinite(perf.avgLThoughtLength)).toBe(true);
    expect(Number.isFinite(perf.avgContextGrowth)).toBe(true);
  });

  it("should maintain backward compatibility (optional field)", async () => {
    // Test that responses still work even if performance metrics are not explicitly checked
    const response = await engine.handleRequest(createParams({
      operation: "h_plan",
      problem: "Test backward compatibility",
      h_thought: "Testing",
    }));
    
    // All original response fields should still be present
    expect(response.content).toBeDefined();
    expect(response.current_state).toBeDefined();
    expect(response.reasoning_metrics).toBeDefined();
    expect(response.session_id).toBeDefined();
    expect(response.diagnostics).toBeDefined();
    
    // Performance metrics are optional but should be present
    expect(response.diagnostics?.performance).toBeDefined();
  });

  it("should track performance across session reset", async () => {
    const sessionId = randomUUID();
    
    await engine.handleRequest(createParams({
      operation: "h_plan",
      session_id: sessionId,
      problem: "Initial session",
      h_thought: "First thought",
    }));
    
    const beforeReset = await engine.handleRequest(createParams({
      operation: "evaluate",
      session_id: sessionId,
    }));
    
    expect(beforeReset.diagnostics?.performance?.totalCycles).toBeGreaterThan(0);
    
    // Reset session
    const afterReset = await engine.handleRequest(createParams({
      operation: "h_plan",
      session_id: sessionId,
      reset_state: true,
      problem: "Reset session",
      h_thought: "New thought after reset",
    }));
    
    // After reset, performance metrics should restart
    expect(afterReset.diagnostics?.performance).toBeDefined();
    // New session should have fresh cycle count
    expect(afterReset.diagnostics?.performance?.totalCycles).toBeGreaterThan(0);
  });

  it("should record performance for duplicate low-level thoughts", async () => {
    const sessionId = randomUUID();
    
    await engine.handleRequest(createParams({
      operation: "l_execute",
      session_id: sessionId,
      l_thought: "Identical thought",
    }));
    
    // Submit same thought again (should be detected as duplicate)
    const response = await engine.handleRequest(createParams({
      operation: "l_execute",
      session_id: sessionId,
      l_thought: "Identical thought",
    }));
    
    // Even duplicates should record cycle duration
    expect(response.diagnostics?.performance?.totalCycles).toBe(2);
    expect(response.diagnostics?.performance?.cycleDurations.length).toBe(2);
  });
});
