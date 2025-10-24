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

  it("evicts sessions after TTL elapses", async () => {
    const manager = new SessionManager(1000);
    const params = createParams();
    const session = await manager.getOrCreate(params);

    expect(await manager.getState(session.sessionId)).toBeDefined();

    vi.advanceTimersByTime(1500);
    await manager.sweepExpiredSessions();

    expect(await manager.getState(session.sessionId)).toBeNull();
  });

  it("reuses active sessions when TTL not exceeded", async () => {
    const manager = new SessionManager(1000);
    const params = createParams();
    const session = await manager.getOrCreate(params);

    vi.advanceTimersByTime(500);
    await manager.sweepExpiredSessions();

    const reused = await manager.getOrCreate(createParams({ session_id: session.sessionId }));
    expect(reused.sessionId).toBe(session.sessionId);
    expect(reused).toBe(session);
  });
});
