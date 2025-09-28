import { describe, it, expect } from "vitest";

import { handleLowLevelExecution } from "../operations/lowLevel.js";
import { createParams, createState } from "./helpers.js";

describe("handleLowLevelExecution", () => {
  it("appends new low-level thoughts and records signature", () => {
    const state = createState();
    const params = createParams({ operation: "l_execute", l_thought: "Investigate race condition" });

    const result = handleLowLevelExecution(state, params);

    expect(result).toContain("Investigate race condition");
    expect(state.lContext).toHaveLength(1);
    expect(state.recentLThoughtHashes).toHaveLength(1);
  });

  it("suppresses duplicate thoughts with normalized signature", () => {
    const state = createState();
    const initial = createParams({ operation: "l_execute", l_thought: "Normalize Signature" });
    handleLowLevelExecution(state, initial);
    expect(state.lContext).toHaveLength(1);

    const duplicateParams = createParams({ operation: "l_execute", l_thought: " normalize   signature  " });
    const duplicate = handleLowLevelExecution(state, duplicateParams);
    expect(duplicate).toContain("Duplicate low-level thought ignored");
    expect(state.lContext).toHaveLength(1);
    expect(state.recentLThoughtHashes).toHaveLength(1);
  });
});
