import { appendContext, normalizeThought, summaryFromContext } from "../utils/text.js";
import { logState } from "../utils/logging.js";
import { HierarchicalState, HRMParameters } from "../types.js";

export const handleHighLevelPlan = (state: HierarchicalState, params: HRMParameters) => {
  const thought = normalizeThought(params.h_thought) ||
    summaryFromContext(state.lContext, params.problem || "No explicit high-level guidance provided yet.");

  state.hContext = appendContext(state.hContext, thought);
  logState("High-level plan updated", { sessionId: state.sessionId, thought });
  return thought;
};

export const handleHighLevelUpdate = (state: HierarchicalState, params: HRMParameters) => {
  const synthesis = normalizeThought(params.h_thought) ||
    `Synthesis after cycle ${state.hCycle}: ${summaryFromContext(state.lContext, "No low-level context available")}`;

  state.hContext = appendContext(state.hContext, synthesis);
  if (params.solution_candidates?.length) {
    state.solutionCandidates = params.solution_candidates;
  }
  logState("High-level update", {
    sessionId: state.sessionId,
    synthesis,
    candidates: state.solutionCandidates.length,
  });
  return synthesis;
};