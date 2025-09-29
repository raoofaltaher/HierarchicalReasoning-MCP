import { appendContext, normalizeThought } from "../utils/text.js";
import { logState } from "../utils/logging.js";
import { HierarchicalState, HRMParameters } from "../types.js";

export const handleLowLevelExecution = (state: HierarchicalState, params: HRMParameters) => {
  const thought = normalizeThought(params.l_thought);
  const finalThought =
    thought || `Detail exploration for H-cycle ${state.hCycle}, L-cycle ${state.lCycle}`;

  const signature = finalThought.toLowerCase().replace(/\s+/g, " ").trim();
  const isDuplicate =
    Boolean(signature) && state.recentLThoughtHashes.includes(signature);

  if (isDuplicate) {
    logState("Low-level execution (duplicate suppressed)", {
      sessionId: state.sessionId,
      signature,
    });
    return `Duplicate low-level thought ignored (signature: ${signature.slice(0, 80)})`;
  }

  state.lContext = appendContext(state.lContext, finalThought);
  if (signature) {
    state.recentLThoughtHashes.push(signature);
    if (state.recentLThoughtHashes.length > 5) {
      state.recentLThoughtHashes.shift();
    }
  }
  logState("Low-level execution", { sessionId: state.sessionId, finalThought });
  return finalThought;
};