/**
 * Tests for structured logging system
 * Validates both text and JSON output formats
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("logging", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalLogFormat: string | undefined;
  let originalDebug: string | undefined;

  beforeEach(() => {
    // Spy on console.error to capture log output
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Save original environment variables
    originalLogFormat = process.env.HRM_LOG_FORMAT;
    originalDebug = process.env.HRM_DEBUG;
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
    
    // Restore environment variables
    if (originalLogFormat !== undefined) {
      process.env.HRM_LOG_FORMAT = originalLogFormat;
    } else {
      delete process.env.HRM_LOG_FORMAT;
    }
    
    if (originalDebug !== undefined) {
      process.env.HRM_DEBUG = originalDebug;
    } else {
      delete process.env.HRM_DEBUG;
    }
    
    // Clear module cache to re-read environment variables
    vi.resetModules();
  });

  describe("text format (default)", () => {
    it("should output colored text for info level", async () => {
      process.env.HRM_LOG_FORMAT = "text";
      const { log } = await import("../utils/logging.js");
      
      log("info", "Test message");
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain("[HRM] INFO");
      expect(output).toContain("Test message");
    });

    it("should include payload in text format", async () => {
      process.env.HRM_LOG_FORMAT = "text";
      const { log } = await import("../utils/logging.js");
      
      const payload = { key: "value", count: 42 };
      log("warn", "Warning message", payload);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Warning message");
      expect(consoleErrorSpy.mock.calls[0][1]).toEqual(payload);
    });

    it("should not output debug logs when HRM_DEBUG is not set", async () => {
      delete process.env.HRM_DEBUG;
      process.env.HRM_LOG_FORMAT = "text";
      const { log } = await import("../utils/logging.js");
      
      log("debug", "Debug message");
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should output debug logs when HRM_DEBUG=true", async () => {
      process.env.HRM_DEBUG = "true";
      process.env.HRM_LOG_FORMAT = "text";
      const { log } = await import("../utils/logging.js");
      
      log("debug", "Debug message");
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("Debug message");
    });
  });

  describe("json format", () => {
    it("should output valid JSON for info level", async () => {
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      log("info", "Test message");
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("level", "info");
      expect(parsed).toHaveProperty("message", "Test message");
      expect(parsed).not.toHaveProperty("context");
    });

    it("should include context in JSON format when payload provided", async () => {
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      const payload = { key: "value", count: 42 };
      log("warn", "Warning message", payload);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("level", "warn");
      expect(parsed).toHaveProperty("message", "Warning message");
      expect(parsed).toHaveProperty("context", payload);
    });

    it("should use ISO 8601 timestamp format", async () => {
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      log("error", "Error message");
      
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      
      // ISO 8601 format validation
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(parsed.timestamp).toMatch(isoRegex);
      
      // Should be parseable as valid date
      const date = new Date(parsed.timestamp);
      expect(date.toISOString()).toBe(parsed.timestamp);
    });

    it("should handle circular references gracefully", async () => {
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      // Create circular reference
      const circular: { self?: unknown } = {};
      circular.self = circular;
      
      log("error", "Circular reference test", circular);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      
      // Should not throw, and output should be valid JSON
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty("serializationError", true);
      expect(parsed).toHaveProperty("level", "error");
      expect(parsed).toHaveProperty("message", "Circular reference test");
    });

    it("should not output debug logs in JSON mode when HRM_DEBUG is not set", async () => {
      delete process.env.HRM_DEBUG;
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      log("debug", "Debug message");
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it("should output debug logs in JSON mode when HRM_DEBUG=true", async () => {
      process.env.HRM_DEBUG = "true";
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      log("debug", "Debug message");
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      
      expect(parsed).toHaveProperty("level", "debug");
      expect(parsed).toHaveProperty("message", "Debug message");
    });

    it("should handle complex nested objects", async () => {
      process.env.HRM_LOG_FORMAT = "json";
      const { log } = await import("../utils/logging.js");
      
      const complexPayload = {
        user: { id: 123, name: "Test User" },
        metadata: {
          tags: ["tag1", "tag2"],
          scores: [9.5, 8.7, 10.0],
        },
        timestamp: new Date().toISOString(),
      };
      
      log("info", "Complex object test", complexPayload);
      
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      
      expect(parsed.context).toEqual(complexPayload);
    });
  });

  describe("logState helper", () => {
    it("should call log with debug level", async () => {
      process.env.HRM_DEBUG = "true";
      process.env.HRM_LOG_FORMAT = "json";
      const { logState } = await import("../utils/logging.js");
      
      const state = { sessionId: "test-123", cycles: 5 };
      logState("State snapshot", state);
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = consoleErrorSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output);
      
      expect(parsed.level).toBe("debug");
      expect(parsed.message).toBe("State snapshot");
      expect(parsed.context).toEqual(state);
    });

    it("should not output when HRM_DEBUG is not set", async () => {
      delete process.env.HRM_DEBUG;
      const { logState } = await import("../utils/logging.js");
      
      logState("State snapshot", { data: "test" });
      
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
