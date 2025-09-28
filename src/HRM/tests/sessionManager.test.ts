import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { SessionManager } from "../state.js";
import { createParams } from "./helpers.js";

describe("SessionManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("evicts sessions after TTL elapses", () => {
    const manager = new SessionManager(1000);
    const params = createParams();
    const session = manager.getOrCreate(params);

    expect(manager.getState(session.sessionId)).toBeDefined();

    vi.advanceTimersByTime(1500);
    manager.sweepExpiredSessions();

    expect(manager.getState(session.sessionId)).toBeUndefined();
  });

  it("reuses active sessions when TTL not exceeded", () => {
    const manager = new SessionManager(1000);
    const params = createParams();
    const session = manager.getOrCreate(params);

    vi.advanceTimersByTime(500);
    manager.sweepExpiredSessions();

    const reused = manager.getOrCreate(createParams({ session_id: session.sessionId }));
    expect(reused.sessionId).toBe(session.sessionId);
    expect(reused).toBe(session);
  });
});
