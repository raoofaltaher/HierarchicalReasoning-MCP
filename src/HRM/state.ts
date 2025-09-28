import { randomUUID } from "node:crypto";
import {
  DEFAULT_COMPLEXITY_ESTIMATE,
  DEFAULT_CONVERGENCE_THRESHOLD,
  DEFAULT_MAX_H_CYCLES,
  DEFAULT_MAX_L_CYCLES_PER_H,
  DEFAULT_SESSION_TTL_MS,
  INITIAL_METRICS,
  MAX_PENDING_ACTIONS,
  MAX_RECENT_DECISIONS,
} from "./constants.js";
import { HierarchicalState, HRMParameters, HRMOperation } from "./types.js";

const cloneMetrics = () => ({ ...INITIAL_METRICS });

const parseContext = (value?: string) => {
  if (!value) {
    return [] as string[];
  }
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const createInitialState = (params: HRMParameters, sessionId?: string): HierarchicalState => {
  const resolvedSessionId = sessionId ?? randomUUID();
  return {
    sessionId: resolvedSessionId,
    hCycle: params.h_cycle ?? 0,
    lCycle: params.l_cycle ?? 0,
    maxLCyclesPerH: params.max_l_cycles_per_h ?? DEFAULT_MAX_L_CYCLES_PER_H,
    maxHCycles: params.max_h_cycles ?? DEFAULT_MAX_H_CYCLES,
    hContext: parseContext(params.h_context),
    lContext: parseContext(params.l_context),
    solutionCandidates: params.solution_candidates ? [...params.solution_candidates] : [],
    convergenceThreshold: params.convergence_threshold ?? DEFAULT_CONVERGENCE_THRESHOLD,
    metrics: cloneMetrics(),
    lastUpdated: Date.now(),
    recentDecisions: [],
    pendingActions: [],
    autoMode: params.operation === "auto_reason",
    problem: params.problem,
    workspacePath: params.workspace_path,
    complexityEstimate: params.complexity_estimate ?? DEFAULT_COMPLEXITY_ESTIMATE,
    frameworkInsight: undefined,
    frameworkNotes: [],
    metricHistory: [],
    plateauCount: 0,
    recentLThoughtHashes: [],
  };
};

const pruneQueue = <T>(items: T[], limit: number) => {
  if (items.length <= limit) {
    return items;
  }
  items.splice(0, items.length - limit);
  return items;
};

export class SessionManager {
  private sessions = new Map<string, HierarchicalState>();
  private readonly ttlMs: number | null;

  constructor(ttlMs: number | null = DEFAULT_SESSION_TTL_MS) {
    this.ttlMs = ttlMs && ttlMs > 0 ? ttlMs : null;
  }

  private isExpired(session: HierarchicalState, now: number) {
    return Boolean(this.ttlMs && now - session.lastUpdated > this.ttlMs);
  }

  private evictExpired(now = Date.now()) {
    if (!this.ttlMs) {
      return;
    }
    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isExpired(session, now)) {
        this.sessions.delete(sessionId);
      }
    }
  }

  sweepExpiredSessions(now = Date.now()) {
    this.evictExpired(now);
  }

  getOrCreate(params: HRMParameters): HierarchicalState {
    this.evictExpired();
    const requestedId = params.session_id;
    const shouldReset = params.reset_state;

    if (requestedId && !shouldReset) {
      const existing = this.sessions.get(requestedId);
      if (existing) {
        if (this.isExpired(existing, Date.now())) {
          this.sessions.delete(requestedId);
        } else {
          existing.maxLCyclesPerH = params.max_l_cycles_per_h ?? existing.maxLCyclesPerH;
          existing.maxHCycles = params.max_h_cycles ?? existing.maxHCycles;
          existing.convergenceThreshold = params.convergence_threshold ?? existing.convergenceThreshold;
          existing.complexityEstimate = params.complexity_estimate ?? existing.complexityEstimate;
          existing.autoMode = params.operation === "auto_reason";
          if (params.problem) {
            existing.problem = params.problem;
          }
          if (params.workspace_path) {
            existing.workspacePath = params.workspace_path;
          }
          if (!existing.frameworkNotes) {
            existing.frameworkNotes = [];
          }
          if (!existing.recentLThoughtHashes) {
            existing.recentLThoughtHashes = [];
          }
          return existing;
        }
      }
    }

    const fresh = createInitialState(params, requestedId);
    this.sessions.set(fresh.sessionId, fresh);
    return fresh;
  }

  reset(sessionId: string, params: HRMParameters) {
    const fresh = createInitialState(params, sessionId);
    this.sessions.set(sessionId, fresh);
    return fresh;
  }

  updateState(session: HierarchicalState, operation: HRMOperation, summary: string) {
    session.lastUpdated = Date.now();
    session.recentDecisions.push(`${operation}:${summary}`);
    pruneQueue(session.recentDecisions, MAX_RECENT_DECISIONS);
    if (session.pendingActions.length) {
      session.pendingActions.shift();
    }
  }

  enqueue(session: HierarchicalState, operations: HRMOperation[]) {
    session.pendingActions.push(...operations);
    pruneQueue(session.pendingActions, MAX_PENDING_ACTIONS);
  }

  getState(sessionId: string) {
    return this.sessions.get(sessionId);
  }
}
