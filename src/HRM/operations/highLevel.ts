import { performance } from "node:perf_hooks";
import { appendContext, normalizeThought, summaryFromContext } from "../utils/text.js";
import { logState } from "../utils/logging.js";
import { HierarchicalState, HRMParameters } from "../types.js";
import { validateThoughtLength } from "../utils/security.js";
import { MAX_THOUGHT_LENGTH } from "../constants.js";
import { recordCycleDuration, recordThoughtLength, recordContextGrowth } from "../state.js";

export const handleHighLevelPlan = (state: HierarchicalState, params: HRMParameters) => {
  const startTime = performance.now();
  
  // Security: Validate thought length to prevent resource exhaustion
  const validatedThought = validateThoughtLength(params.h_thought, MAX_THOUGHT_LENGTH, "h_thought");
  const thought = normalizeThought(validatedThought) ||
    summaryFromContext(state.lContext, params.problem || "No explicit high-level guidance provided yet.");

  const previousSize = state.hContext.join("\n").length;
  state.hContext = appendContext(state.hContext, thought);
  const currentSize = state.hContext.join("\n").length;
  
  // Performance tracking
  const duration = performance.now() - startTime;
  recordCycleDuration(state, duration);
  recordThoughtLength(state, thought, "h");
  recordContextGrowth(state, previousSize, currentSize);
  
  logState("High-level plan updated", { sessionId: state.sessionId, thought });
  return thought;
};

export const handleHighLevelUpdate = (state: HierarchicalState, params: HRMParameters) => {
  const startTime = performance.now();
  
  // Security: Validate thought length to prevent resource exhaustion
  const validatedThought = validateThoughtLength(params.h_thought, MAX_THOUGHT_LENGTH, "h_thought");
  const synthesis = normalizeThought(validatedThought) ||
    `Synthesis after cycle ${state.hCycle}: ${summaryFromContext(state.lContext, "No low-level context available")}`;

  const previousSize = state.hContext.join("\n").length;
  state.hContext = appendContext(state.hContext, synthesis);
  const currentSize = state.hContext.join("\n").length;
  
  if (params.solution_candidates?.length) {
    state.solutionCandidates = params.solution_candidates;
  }
  
  // Performance tracking
  const duration = performance.now() - startTime;
  recordCycleDuration(state, duration);
  recordThoughtLength(state, synthesis, "h");
  recordContextGrowth(state, previousSize, currentSize);
  
  logState("High-level update", {
    sessionId: state.sessionId,
    synthesis,
    candidates: state.solutionCandidates.length,
  });
  return synthesis;
};