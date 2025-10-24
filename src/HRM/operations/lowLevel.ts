import { performance } from "node:perf_hooks";
import { appendContext, normalizeThought } from "../utils/text.js";
import { logState } from "../utils/logging.js";
import { HierarchicalState, HRMParameters } from "../types.js";
import { validateThoughtLength } from "../utils/security.js";
import { MAX_THOUGHT_LENGTH } from "../constants.js";
import { recordCycleDuration, recordThoughtLength, recordContextGrowth } from "../state.js";

export const handleLowLevelExecution = (state: HierarchicalState, params: HRMParameters) => {
  const startTime = performance.now();
  
  // Security: Validate thought length to prevent resource exhaustion
  const validatedThought = validateThoughtLength(params.l_thought, MAX_THOUGHT_LENGTH, "l_thought");
  const thought = normalizeThought(validatedThought);
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
    // Still track performance even for duplicates
    const duration = performance.now() - startTime;
    recordCycleDuration(state, duration);
    return `Duplicate low-level thought ignored (signature: ${signature.slice(0, 80)})`;
  }

  const previousSize = state.lContext.join("\n").length;
  state.lContext = appendContext(state.lContext, finalThought);
  const currentSize = state.lContext.join("\n").length;
  
  if (signature) {
    state.recentLThoughtHashes.push(signature);
    if (state.recentLThoughtHashes.length > 5) {
      state.recentLThoughtHashes.shift();
    }
  }
  
  // Performance tracking
  const duration = performance.now() - startTime;
  recordCycleDuration(state, duration);
  recordThoughtLength(state, finalThought, "l");
  recordContextGrowth(state, previousSize, currentSize);
  
  logState("Low-level execution", { sessionId: state.sessionId, finalThought });
  return finalThought;
};