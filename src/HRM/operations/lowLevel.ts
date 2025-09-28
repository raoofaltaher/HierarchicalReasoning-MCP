import { appendContext, normalizeThought } from "../utils/text.js";
import { logState } from "../utils/logging.js";
import { HierarchicalState, HRMParameters } from "../types.js";

export const handleLowLevelExecution = (state: HierarchicalState, params: HRMParameters) => {
  const thought = normalizeThought(params.l_thought);
  const finalThought =
    thought || `Detail exploration for H-cycle ${state.hCycle}, L-cycle ${state.lCycle}`;

  state.lContext = appendContext(state.lContext, finalThought);
  logState("Low-level execution", { sessionId: state.sessionId, finalThought });
  return finalThought;
};