import {
  DEFAULT_MAX_H_CYCLES,
  DEFAULT_MAX_L_CYCLES_PER_H,
  MAX_PLATEAU_BEFORE_HALT,
  OPERATION_PRIORITIES,
} from "../constants.js";
import { HierarchicalState, HRMOperation } from "../types.js";

const incrementCycle = (state: HierarchicalState, type: "h" | "l") => {
  if (type === "l") {
    const next = state.lCycle + 1;
    if (next >= state.maxLCyclesPerH) {
      state.lCycle = 0;
      state.hCycle = Math.min(state.hCycle + 1, state.maxHCycles);
    } else {
      state.lCycle = next;
    }
  }
  if (type === "h") {
    state.hCycle = Math.min(state.hCycle + 1, state.maxHCycles);
    state.lCycle = 0;
  }
};

export const handleCycleProgression = (state: HierarchicalState, completed: HRMOperation) => {
  if (completed === "l_execute") {
    incrementCycle(state, "l");
  }
  if (completed === "h_update" || completed === "h_plan") {
    incrementCycle(state, "h");
  }
};

export const suggestNextOperation = (state: HierarchicalState, lastOperation: HRMOperation): HRMOperation => {
  const plateauCount = state.plateauCount ?? 0;
  if (plateauCount >= MAX_PLATEAU_BEFORE_HALT) {
    return "halt_check";
  }

  if (state.autoMode) {
    if (state.metrics.shouldContinue) {
      if (state.lCycle === 0 && lastOperation !== "h_plan") {
        return "h_plan";
      }
      if (state.lCycle < state.maxLCyclesPerH - 1) {
        return "l_execute";
      }
      return "evaluate";
    }
    return "halt_check";
  }

  if (!state.hContext.length) {
    return "h_plan";
  }
  if (state.lContext.length < state.maxLCyclesPerH) {
    return "l_execute";
  }
  if (lastOperation === "l_execute") {
    return "h_update";
  }
  const candidate: HRMOperation[] = ["evaluate", "halt_check", "l_execute"];
  return candidate.sort((a, b) => OPERATION_PRIORITIES[a] - OPERATION_PRIORITIES[b])[0];
};

export const applyDefaults = (state: HierarchicalState) => {
  state.maxHCycles = state.maxHCycles || DEFAULT_MAX_H_CYCLES;
  state.maxLCyclesPerH = state.maxLCyclesPerH || DEFAULT_MAX_L_CYCLES_PER_H;
};
