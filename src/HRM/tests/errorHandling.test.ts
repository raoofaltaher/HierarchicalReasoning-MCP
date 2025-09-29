import { describe, expect, it } from "vitest";
import { HierarchicalReasoningEngine } from "../engine.js";
import type { HRMParameters } from "../types.js";

describe("error handling", () => {
  it("returns a structured error payload for unsupported operations", async () => {
    const engine = new HierarchicalReasoningEngine();
    const response = await engine.handleRequest({
      operation: "unsupported_operation",
    } as unknown as HRMParameters);

    expect(response.isError).toBe(true);
    expect(response.error_message).toContain("Unsupported operation");
    expect(response.suggested_next_operation).toBe("evaluate");
    expect(response.content[0]?.text).toContain("unsupported_operation");
  });
});
