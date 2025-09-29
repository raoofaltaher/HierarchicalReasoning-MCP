import { describe, expect, it } from "vitest";
import { MAX_PLATEAU_BEFORE_HALT } from "../constants.js";
import { suggestNextOperation } from "../utils/suggestions.js";
import { createState } from "./helpers.js";

describe("suggestNextOperation", () => {
  it("returns h_plan at the start of a new high-level cycle in auto mode", () => {
    const state = createState({ autoMode: true, lCycle: 0 });

    const next = suggestNextOperation(state, "l_execute");

    expect(next).toBe("h_plan");
  });

  it("returns evaluate after completing maximum low-level cycles", () => {
    const limit = createState().maxLCyclesPerH;
    const state = createState({ autoMode: true, lCycle: limit - 1 });

    const next = suggestNextOperation(state, "l_execute");

    expect(next).toBe("evaluate");
  });

  it("prioritizes halt_check when plateau threshold is reached", () => {
    const state = createState({ plateauCount: MAX_PLATEAU_BEFORE_HALT });

    const next = suggestNextOperation(state, "l_execute");

    expect(next).toBe("halt_check");
  });
});
