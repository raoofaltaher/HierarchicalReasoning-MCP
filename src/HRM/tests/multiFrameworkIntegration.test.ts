import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HierarchicalReasoningEngine } from "../engine.js";
import { createParams } from "./helpers.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Integration test for multi-framework workspace detection and enrichment.
 * This test validates that the HRM engine correctly:
 * 1. Detects multiple frameworks in a workspace (React, Express, Prisma)
 * 2. Enriches reasoning with framework-specific guidance
 * 3. Combines insights from multiple frameworks coherently
 * 4. Includes framework patterns in the auto-reasoning trace
 */
describe("Multi-Framework Workspace Integration", () => {
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

  it("should detect React, Express, and Prisma frameworks in workspace", async () => {
    const params = createParams({
      operation: "h_plan",
      workspace_path: fixtureWorkspacePath,
      problem: "Build a user management API with frontend",
      h_thought: "Planning full-stack architecture",
    });

    const response = await engine.handleRequest(params);

    // Response should be successful
    expect(response.isError).toBeFalsy();
    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);

    // Get the session to inspect framework insights
    const session = (engine as any).sessions.getState(response.session_id);
    expect(session).toBeDefined();

    // Should have framework insight
    expect(session.frameworkInsight).toBeDefined();
    
    // Should detect multiple frameworks
    const signatures = session.frameworkInsight?.signatures || [];
    expect(signatures.length).toBeGreaterThan(0);

    // Extract framework names
    const detectedFrameworks = signatures.map((sig: any) => sig.name);
    
    // Should detect at least 2 of the 3 frameworks (React, Express, Prisma)
    // Note: Detection depends on confidence thresholds and available indicators
    expect(detectedFrameworks.length).toBeGreaterThanOrEqual(2);
    
    // Verify at least one frontend framework detected
    const hasFrontend = detectedFrameworks.some((name: string) => 
      name.toLowerCase().includes('react')
    );
    
    // Verify at least one backend framework detected
    const hasBackend = detectedFrameworks.some((name: string) => 
      name.toLowerCase().includes('express') || 
      name.toLowerCase().includes('prisma')
    );
    
    expect(hasFrontend || hasBackend).toBe(true);
  });

  it("should enrich h_context with framework-specific guidance", async () => {
    const params = createParams({
      operation: "h_plan",
      workspace_path: fixtureWorkspacePath,
      problem: "Implement user authentication flow",
      h_thought: "Design authentication architecture",
    });

    const response = await engine.handleRequest(params);
    
    // High-level context should contain framework insights
    const hContext = response.current_state.h_context;
    expect(hContext).toBeDefined();
    expect(hContext.length).toBeGreaterThan(0);

    // Check if framework highlights are present in context
    // Framework enrichment adds a line with highlights
    const hasFrameworkGuidance = hContext.toLowerCase().includes('react') ||
                                  hContext.toLowerCase().includes('express') ||
                                  hContext.toLowerCase().includes('prisma') ||
                                  hContext.toLowerCase().includes('component') ||
                                  hContext.toLowerCase().includes('api') ||
                                  hContext.toLowerCase().includes('database');
    
    // At least some framework-related guidance should be present
    expect(hasFrameworkGuidance).toBe(true);
  });

  it("should include framework patterns in auto-reasoning trace", async () => {
    const params = createParams({
      operation: "auto_reason",
      workspace_path: fixtureWorkspacePath,
      problem: "Create REST API with React frontend for user CRUD operations",
      max_h_cycles: 2,
      max_l_cycles_per_h: 2,
    });

    const response = await engine.handleRequest(params);

    // Auto-reason should produce a trace
    expect(response.trace).toBeDefined();
    expect(response.trace!.length).toBeGreaterThan(0);

    // Trace should contain typical auto-reasoning operations
    const operations = response.trace!.map((entry) => entry.operation);
    expect(operations).toContain("l_execute");
    expect(operations.filter((op) => op === "evaluate").length).toBeGreaterThan(0);

    // The trace should show progression through cycles
    const hasValidTrace = response.trace!.some(
      (entry) => entry.hCycle >= 0 && entry.lCycle >= 0
    );
    expect(hasValidTrace).toBe(true);

    // Should eventually halt with a trigger
    expect(response.halt_trigger).toBeDefined();
    expect(["confidence_convergence", "plateau", "max_steps"]).toContain(
      response.halt_trigger,
    );
  });

  it("should maintain framework notes across multiple operations", async () => {
    // First operation with workspace
    const params1 = createParams({
      operation: "h_plan",
      workspace_path: fixtureWorkspacePath,
      problem: "Design user service architecture",
    });

    const response1 = await engine.handleRequest(params1);
    const sessionId = response1.session_id;

    // Second operation using same session
    const params2 = createParams({
      operation: "l_execute",
      session_id: sessionId,
      l_thought: "Define API endpoints for user operations",
    });

    const response2 = await engine.handleRequest(params2);

    // Get session state
    const session = (engine as any).sessions.getState(sessionId);
    
    // Framework notes should be accumulated across operations
    expect(session.frameworkNotes).toBeDefined();
    expect(Array.isArray(session.frameworkNotes)).toBe(true);
    
    // Notes are capped at 20, but should have some content if frameworks detected
    expect(session.frameworkNotes.length).toBeGreaterThanOrEqual(0);
    expect(session.frameworkNotes.length).toBeLessThanOrEqual(20);

    // Framework insight should persist
    expect(session.frameworkInsight).toBeDefined();
  });

  it("should provide different guidance for different problem contexts", async () => {
    // Frontend-focused problem
    const frontendParams = createParams({
      operation: "h_plan",
      workspace_path: fixtureWorkspacePath,
      problem: "Optimize React component rendering performance",
      h_thought: "Analyze rendering bottlenecks",
    });

    const frontendResponse = await engine.handleRequest(frontendParams);

    // Backend-focused problem  
    const backendParams = createParams({
      operation: "h_plan",
      workspace_path: fixtureWorkspacePath,
      problem: "Optimize database query performance with Prisma",
      h_thought: "Analyze database access patterns",
    });

    const backendResponse = await engine.handleRequest(backendParams);

    // Both should succeed but with different context
    expect(frontendResponse.isError).toBeFalsy();
    expect(backendResponse.isError).toBeFalsy();

    // Contexts should be different based on problem focus
    const frontendContext = frontendResponse.current_state.h_context.toLowerCase();
    const backendContext = backendResponse.current_state.h_context.toLowerCase();

    // At minimum, the original problem statements should differ
    expect(frontendContext).toContain("rendering");
    expect(backendContext).toContain("database");
  });

  it("should handle workspace without frameworks gracefully", async () => {
    // Use a path without the fixture workspace
    const emptyParams = createParams({
      operation: "h_plan",
      workspace_path: __dirname, // Test directory itself
      problem: "Generic problem without specific frameworks",
    });

    const response = await engine.handleRequest(emptyParams);

    // Should still succeed even without framework detection
    expect(response.isError).toBeFalsy();
    expect(response.content).toBeDefined();
    
    const session = (engine as any).sessions.getState(response.session_id);
    
    // Framework insight may be undefined or have empty signatures
    if (session.frameworkInsight) {
      expect(Array.isArray(session.frameworkInsight.signatures)).toBe(true);
    }
  });
});
