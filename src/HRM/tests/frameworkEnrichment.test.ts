import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createParams } from "./helpers.js";

const buildNotes = (count: number) => Array.from({ length: count }, (_, idx) => `note-${idx}`);

describe("framework enrichment", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mock("../frameworks/index.js", () => ({
      FrameworkReasoningManager: class {
        async generateReasoning() {
          return {
            insight: {
              signatures: [],
              reasoningHighlights: ["Highlight A", "Highlight B"],
              recommendedPatterns: [],
            },
            specializedPatterns: [
              { name: "Pattern X", guidance: "Use feature X", description: "desc" },
            ],
            notes: buildNotes(25),
          };
        }
      },
    }));
    // Mock security validation to allow test paths
    vi.mock("../utils/security.js", () => ({
      validateWorkspacePath: vi.fn((path: string) => {
        // Allow test paths to pass validation
        return;
      }),
      validateThoughtLength: vi.fn((thought: string) => thought),
    }));
  });

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("appends framework insights and caps stored notes", async () => {
    const { HierarchicalReasoningEngine } = await import("../engine.js");
    const engine = new HierarchicalReasoningEngine();
    const params = createParams({
      operation: "h_plan",
      workspace_path: "/tmp/enrichment",
      problem: "React rendering issue",
    });

    const response = await engine.handleRequest(params);

    expect(response.current_state.h_context).toContain("Highlight A | Highlight B");

    const session = await (engine as unknown as { sessions: { getState: (id: string) => Promise<any> } }).sessions.getState(
      response.session_id,
    );
    expect(session.frameworkNotes.length).toBe(20);
    expect(session.frameworkNotes[0]).toBe("note-5");
    const guidanceEntry = response.content.find(
      (item) => item.type === "text" && item.text.startsWith("Framework guidance"),
    );
    expect(guidanceEntry?.text).toContain("note-21");
    expect(guidanceEntry?.text).toContain("note-24");
    const patternSummary = session.hContext.find((entry: string) => entry.includes("Pattern X"));
    expect(patternSummary).toBeDefined();
  });
});
