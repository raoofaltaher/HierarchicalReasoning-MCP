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
  MAX_SESSIONS,
} from "./constants.js";
import { HierarchicalState, HRMParameters, HRMOperation } from "./types.js";
import { log } from "./utils/logging.js";

/**
 * PersistenceAdapter Interface
 * 
 * Defines the contract for session persistence implementations.
 * Enables pluggable storage backends (in-memory, Redis, SQLite, file-based, etc.)
 * without changing SessionManager logic.
 * 
 * Following the Adapter pattern from design patterns best practices.
 */
export interface PersistenceAdapter {
  /**
   * Load a session by ID. Returns null if not found or expired.
   */
  load(sessionId: string): Promise<HierarchicalState | null>;
  
  /**
   * Save (create or update) a session state.
   */
  save(state: HierarchicalState): Promise<void>;
  
  /**
   * Evict sessions older than the specified timestamp.
   * Returns the number of sessions evicted.
   */
  evict(beforeTimestamp: number): Promise<number>;
  
  /**
   * Get all session IDs (for testing and diagnostics).
   */
  getAllSessionIds(): Promise<string[]>;
  
  /**
   * Get the current count of sessions (for testing and limits enforcement).
   */
  size(): Promise<number>;
  
  /**
   * Delete a specific session by ID.
   */
  delete(sessionId: string): Promise<boolean>;
}

/**
 * InMemoryPersistenceAdapter
 * 
 * Default implementation using Map for in-memory storage.
 * Maintains current behavior while enabling future persistence strategies.
 * Suitable for development and single-instance deployments.
 * 
 * For production with multiple instances or persistence requirements,
 * consider RedisPersistenceAdapter or SQLitePersistenceAdapter.
 */
export class InMemoryPersistenceAdapter implements PersistenceAdapter {
  private sessions = new Map<string, HierarchicalState>();
  
  async load(sessionId: string): Promise<HierarchicalState | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  
  async save(state: HierarchicalState): Promise<void> {
    this.sessions.set(state.sessionId, state);
  }
  
  async evict(beforeTimestamp: number): Promise<number> {
    let evicted = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastUpdated < beforeTimestamp) {
        this.sessions.delete(sessionId);
        evicted++;
      }
    }
    return evicted;
  }
  
  async getAllSessionIds(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }
  
  async size(): Promise<number> {
    return this.sessions.size;
  }
  
  async delete(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }
  
  /**
   * Get the least recently used session ID.
   * Used for LRU eviction when MAX_SESSIONS limit is reached.
   */
  async getLRUSessionId(): Promise<string | null> {
    let oldestSessionId: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastUpdated < oldestTimestamp) {
        oldestTimestamp = session.lastUpdated;
        oldestSessionId = sessionId;
      }
    }
    
    return oldestSessionId;
  }
}

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
  private readonly adapter: PersistenceAdapter;
  private readonly ttlMs: number | null;

  constructor(
    ttlMs: number | null = DEFAULT_SESSION_TTL_MS,
    adapter?: PersistenceAdapter
  ) {
    this.ttlMs = ttlMs && ttlMs > 0 ? ttlMs : null;
    this.adapter = adapter ?? new InMemoryPersistenceAdapter();
  }

  private isExpired(session: HierarchicalState, now: number) {
    return Boolean(this.ttlMs && now - session.lastUpdated > this.ttlMs);
  }

  private async evictExpired(now = Date.now()) {
    if (!this.ttlMs) {
      return;
    }
    const cutoff = now - this.ttlMs;
    await this.adapter.evict(cutoff);
  }

  /**
   * Security: Evict least recently used sessions when MAX_SESSIONS limit is reached.
   * Prevents DoS attacks via unlimited session creation.
   */
  private async evictLRUIfNeeded() {
    const sessionCount = await this.adapter.size();
    if (sessionCount < MAX_SESSIONS) {
      return;
    }

    // For InMemoryPersistenceAdapter, use getLRUSessionId helper
    // For other adapters, they should implement LRU logic internally
    if (this.adapter instanceof InMemoryPersistenceAdapter) {
      const oldestSessionId = await this.adapter.getLRUSessionId();
      if (oldestSessionId) {
        log("warn", "Session limit reached, evicting LRU session", {
          evicted_session_id: oldestSessionId,
          session_count: sessionCount,
          max_sessions: MAX_SESSIONS,
        });
        await this.adapter.delete(oldestSessionId);
      }
    } else {
      // For other adapters, assume they handle LRU internally
      log("warn", "Session limit reached but LRU eviction not supported by adapter", {
        session_count: sessionCount,
        max_sessions: MAX_SESSIONS,
      });
    }
  }

  async sweepExpiredSessions(now = Date.now()) {
    await this.evictExpired(now);
  }

  async getOrCreate(params: HRMParameters): Promise<HierarchicalState> {
    await this.evictExpired();
    await this.evictLRUIfNeeded(); // Security: Enforce session limit
    const requestedId = params.session_id;
    const shouldReset = params.reset_state;

    if (requestedId && !shouldReset) {
      const existing = await this.adapter.load(requestedId);
      if (existing) {
        if (this.isExpired(existing, Date.now())) {
          await this.adapter.delete(requestedId);
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
          await this.adapter.save(existing);
          return existing;
        }
      }
    }

    const fresh = createInitialState(params, requestedId);
    await this.adapter.save(fresh);
    return fresh;
  }

  async reset(sessionId: string, params: HRMParameters): Promise<HierarchicalState> {
    const fresh = createInitialState(params, sessionId);
    await this.adapter.save(fresh);
    return fresh;
  }

  async updateState(session: HierarchicalState, operation: HRMOperation, summary: string): Promise<void> {
    session.lastUpdated = Date.now();
    session.recentDecisions.push(`${operation}:${summary}`);
    pruneQueue(session.recentDecisions, MAX_RECENT_DECISIONS);
    if (session.pendingActions.length) {
      session.pendingActions.shift();
    }
    await this.adapter.save(session);
  }

  async enqueue(session: HierarchicalState, operations: HRMOperation[]): Promise<void> {
    session.pendingActions.push(...operations);
    pruneQueue(session.pendingActions, MAX_PENDING_ACTIONS);
    await this.adapter.save(session);
  }

  async getState(sessionId: string): Promise<HierarchicalState | null> {
    return await this.adapter.load(sessionId);
  }

  /**
   * Get the current number of active sessions (for testing)
   */
  async size(): Promise<number> {
    return await this.adapter.size();
  }

  /**
   * Get all session IDs (for testing)
   */
  async getAllSessionIds(): Promise<string[]> {
    return await this.adapter.getAllSessionIds();
  }
}
