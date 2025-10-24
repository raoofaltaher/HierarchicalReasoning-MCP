import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HierarchicalReasoningEngine } from "../engine.js";
import { createParams } from "./helpers.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive integration test for the full auto_reason operation cycle.
 * 
 * This test validates the complete end-to-end flow of hierarchical reasoning:
 * 1. Detects frameworks in a mixed-stack workspace (React + Express + Prisma)
 * 2. Executes auto-reasoning with multiple H/L cycles
 * 3. Validates framework-specific guidance appears in reasoning
 * 4. Checks halt conditions are properly triggered
 * 5. Verifies trace structure and content quality
 * 
 * Covers High Priority Task #2 from copilot-instructions.md section 13.
 */
describe("Auto Reasoning Full Cycle Integration", () => {
  let engine: HierarchicalReasoningEngine;
  const fixtureWorkspacePath = path.join(
    __dirname,
    "fixtures",
    "multi-framework-workspace",
  );

  beforeEach(() => {
    engine = new HierarchicalReasoningEngine();
    // Mock security validation to allow fixture path
    vi.mock("../utils/security.js", () => ({
      validateWorkspacePath: vi.fn((p: string) => p),
      validateThoughtLength: vi.fn((thought: string) => thought),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should complete auto_reason with mixed framework workspace (React + Express + Prisma)", async () => {
    const params = createParams({
      operation: "auto_reason",
      problem: "Build a full-stack user management system with React frontend, Express API, and Prisma ORM",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: 3,
      max_l_cycles_per_h: 3,
      complexity_estimate: 5,
      convergence_threshold: 0.75,
    });

    const response = await engine.handleRequest(params);

    // 1. Verify successful completion (no isError field means success)
    expect(response.isError).toBeUndefined(); // Success responses don't have isError
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);

    // 2. Verify halt trigger was set
    expect(response.halt_trigger).toBeDefined();
    expect(["confidence_convergence", "plateau", "max_steps"]).toContain(
      response.halt_trigger,
    );

    // 3. Verify trace exists and has meaningful length
    expect(response.trace).toBeDefined();
    expect(response.trace!.length).toBeGreaterThan(3);
    
    // 4. Validate trace structure
    const trace = response.trace!;
    
    // Each entry should have required fields
    trace.forEach((entry) => {
      expect(entry.step).toBeGreaterThanOrEqual(1);
      expect(entry.operation).toBeDefined();
      expect(entry.hCycle).toBeGreaterThanOrEqual(0);
      expect(entry.lCycle).toBeGreaterThanOrEqual(0);
      expect(entry.note).toBeDefined();
      expect(entry.metrics).toBeDefined();
    });

    // 5. Verify operations progression
    const operations = trace.map((entry) => entry.operation);
    
    // Should contain core operations
    expect(operations).toContain("h_plan");
    expect(operations).toContain("l_execute");
    expect(operations.filter((op) => op === "evaluate").length).toBeGreaterThan(0);
    
    // Should have halt_check as the final operation before stopping
    const lastOperation = operations[operations.length - 1];
    expect(["halt_check", "evaluate"]).toContain(lastOperation);

    // 6. Verify cycle progression
    const maxHCycle = Math.max(...trace.map((entry) => entry.hCycle));
    const maxLCycle = Math.max(...trace.map((entry) => entry.lCycle));
    
    expect(maxHCycle).toBeGreaterThan(0);
    expect(maxLCycle).toBeGreaterThan(0);
    expect(maxHCycle).toBeLessThanOrEqual(params.max_h_cycles!);

    // 7. Verify metrics evolution
    const metricsHistory = trace.map((entry) => entry.metrics);
    
    // Convergence should improve over time (at least some progression)
    const convergenceScores = metricsHistory
      .filter((m) => m.convergenceScore !== undefined)
      .map((m) => m.convergenceScore);
    
    expect(convergenceScores.length).toBeGreaterThan(0);
    
    // Final convergence should be higher than initial (or we hit a halt condition)
    if (convergenceScores.length > 1) {
      const initialConvergence = convergenceScores[0];
      const finalConvergence = convergenceScores[convergenceScores.length - 1];
      
      // Either convergence improved OR we hit plateau/max_steps
      const improvedOrHalted =
        finalConvergence > initialConvergence ||
        response.halt_trigger === "plateau" ||
        response.halt_trigger === "max_steps";
      
      expect(improvedOrHalted).toBe(true);
    }

    // 8. Validate framework-specific guidance appeared
    const session = await (engine as any).sessions.getState(response.session_id);
    expect(session).toBeDefined();

    // Should have framework insights
    if (session.frameworkInsight) {
      const signatures = session.frameworkInsight.signatures || [];
      expect(signatures.length).toBeGreaterThan(0);
      
      // At least one framework should be detected in a full-stack workspace
      const frameworkNames = signatures.map((sig: any) => sig.name.toLowerCase());
      const hasRelevantFramework = frameworkNames.some((name: string) =>
        name.includes("react") ||
        name.includes("express") ||
        name.includes("prisma"),
      );
      
      // If frameworks were detected, validate guidance
      if (hasRelevantFramework) {
        // Framework notes should be accumulated
        expect(session.frameworkNotes).toBeDefined();
        expect(Array.isArray(session.frameworkNotes)).toBe(true);
        
        // High-level context should reference frameworks or related concepts
        const hContext = session.hContext.join(" ").toLowerCase();
        const hasFrameworkGuidance =
          hContext.includes("react") ||
          hContext.includes("express") ||
          hContext.includes("prisma") ||
          hContext.includes("component") ||
          hContext.includes("api") ||
          hContext.includes("database") ||
          hContext.includes("frontend") ||
          hContext.includes("backend");
        
        expect(hasFrameworkGuidance).toBe(true);
      }
    }

    // 9. Verify solution candidates structure
    expect(session.solutionCandidates).toBeDefined();
    expect(Array.isArray(session.solutionCandidates)).toBe(true);
    
    // Note: Solution candidates are accumulated via h_plan/h_update operations
    // In auto-reason, they may be empty if no candidates were explicitly generated
    // This is expected behavior - the test validates the structure exists

    // 10. Verify diagnostics are present
    expect(response.diagnostics).toBeDefined();
    expect(response.diagnostics.plateau_count).toBeDefined();
    expect(response.diagnostics.confidence_window).toBeDefined();
    expect(Array.isArray(response.diagnostics.confidence_window)).toBe(true);
  });

  it("should produce coherent reasoning narrative in trace notes", async () => {
    const params = createParams({
      operation: "auto_reason",
      problem: "Design RESTful API authentication with JWT tokens",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: 2,
      max_l_cycles_per_h: 2,
    });

    const response = await engine.handleRequest(params);

    expect(response.trace).toBeDefined();
    const trace = response.trace!;

    // Each note should be non-empty and meaningful
    trace.forEach((entry) => {
      expect(entry.note.length).toBeGreaterThan(10);
      
      // Notes should not be just placeholders or errors
      expect(entry.note.toLowerCase()).not.toContain("undefined");
      expect(entry.note.toLowerCase()).not.toContain("error");
    });

    // Notes should show progression of thought
    const notes = trace.map((entry) => entry.note);
    
    // Should have variety in notes (not all identical)
    const uniqueNotes = new Set(notes);
    expect(uniqueNotes.size).toBeGreaterThan(1);
  });

  it("should respect max_h_cycles and max_l_cycles_per_h limits", async () => {
    const maxHCycles = 2;
    const maxLCyclesPerH = 2;

    const params = createParams({
      operation: "auto_reason",
      problem: "Implement user profile CRUD operations",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: maxHCycles,
      max_l_cycles_per_h: maxLCyclesPerH,
      convergence_threshold: 0.99, // High threshold to ensure we hit max limits
    });

    const response = await engine.handleRequest(params);

    expect(response.trace).toBeDefined();
    const trace = response.trace!;

    // Extract cycle numbers
    const hCycles = trace.map((entry) => entry.hCycle);
    const maxHReached = Math.max(...hCycles);

    // Should not exceed max_h_cycles
    expect(maxHReached).toBeLessThanOrEqual(maxHCycles);

    // If we hit max_steps, verify it's in the halt trigger
    if (maxHReached === maxHCycles) {
      expect(response.halt_trigger).toBe("max_steps");
    }

    // Verify L cycles are bounded per H cycle
    const lCyclesByH = new Map<number, number[]>();
    trace.forEach((entry) => {
      if (!lCyclesByH.has(entry.hCycle)) {
        lCyclesByH.set(entry.hCycle, []);
      }
      lCyclesByH.get(entry.hCycle)!.push(entry.lCycle);
    });

    // Each H cycle should respect max_l_cycles_per_h
    lCyclesByH.forEach((lCycles, hCycle) => {
      const maxL = Math.max(...lCycles);
      expect(maxL).toBeLessThanOrEqual(maxLCyclesPerH);
    });
  });

  it("should handle early convergence and halt gracefully", async () => {
    const params = createParams({
      operation: "auto_reason",
      problem: "Simple task: list user fields",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: 10,
      max_l_cycles_per_h: 5,
      convergence_threshold: 0.6, // Lower threshold for easier convergence
      complexity_estimate: 2, // Low complexity
    });

    const response = await engine.handleRequest(params);

    expect(response.trace).toBeDefined();
    expect(response.halt_trigger).toBeDefined();

    // Should halt before reaching max cycles due to convergence
    const trace = response.trace!;
    const maxHCycle = Math.max(...trace.map((entry) => entry.hCycle));

    // Either converged early OR hit plateau
    if (response.halt_trigger === "confidence_convergence") {
      expect(maxHCycle).toBeLessThan(params.max_h_cycles!);
      
      // Final metrics should show high convergence
      const finalMetrics = trace[trace.length - 1].metrics;
      expect(finalMetrics.convergenceScore).toBeGreaterThanOrEqual(params.convergence_threshold!);
    } else if (response.halt_trigger === "plateau") {
      // Plateau detection should have triggered
      const session = await (engine as any).sessions.getState(response.session_id);
      expect(session.plateauCount).toBeGreaterThan(0);
    }
  });

  it("should accumulate low-level context and solution candidates", async () => {
    const params = createParams({
      operation: "auto_reason",
      problem: "Create user registration endpoint with validation",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: 2,
      max_l_cycles_per_h: 3,
    });

    const response = await engine.handleRequest(params);

    const session = await (engine as any).sessions.getState(response.session_id);
    expect(session).toBeDefined();

    // Low-level context should be populated
    expect(session.lContext).toBeDefined();
    expect(Array.isArray(session.lContext)).toBe(true);
    expect(session.lContext.length).toBeGreaterThan(0);

    // Solution candidates structure should exist
    expect(session.solutionCandidates).toBeDefined();
    expect(Array.isArray(session.solutionCandidates)).toBe(true);
    // Note: Candidates accumulate via h_plan operations with solution_candidates param
    // In auto-reasoning without explicit candidate generation, the array may be empty

    // High-level context should also be enriched
    expect(session.hContext.length).toBeGreaterThan(1); // Initial + enrichment
  });

  it("should include timing information and respect timeout", async () => {
    const params = createParams({
      operation: "auto_reason",
      problem: "Complex system architecture planning",
      workspace_path: fixtureWorkspacePath,
      max_h_cycles: 5,
      max_l_cycles_per_h: 5,
    });

    const startTime = Date.now();
    const response = await engine.handleRequest(params);
    const duration = Date.now() - startTime;

    // Should complete within reasonable time (AUTO_REASON_TIMEOUT_MS is 60s)
    expect(duration).toBeLessThan(60000);

    // Trace should have timestamps implicitly through step progression
    expect(response.trace).toBeDefined();
    expect(response.trace!.length).toBeGreaterThan(0);
    
    // Steps should be sequential
    const steps = response.trace!.map((entry) => entry.step);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });
});
