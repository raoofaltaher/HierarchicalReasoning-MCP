import chalk from "chalk";
import { LOG_PREFIX } from "../constants.js";

export type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Log output format: "text" (colored, human-readable) or "json" (structured, machine-readable)
 * Controlled by HRM_LOG_FORMAT environment variable (default: "text")
 */
type LogFormat = "json" | "text";

/**
 * Structured log entry for JSON format
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: unknown;
}

// Read format once at module load time for performance
const LOG_FORMAT: LogFormat = (process.env.HRM_LOG_FORMAT as LogFormat) || "text";

const levelColors = {
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.gray,
} as const;

const isDebugEnabled = () => (process.env.HRM_DEBUG || "").toLowerCase() === "true";

/**
 * Format log entry as single-line JSON
 * Handles circular references and non-serializable objects gracefully
 */
function formatJsonLog(entry: LogEntry): string {
  try {
    return JSON.stringify(entry);
  } catch (error) {
    // Fallback for circular references or non-serializable objects
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: String(entry.context),
      serializationError: true,
    });
  }
}

/**
 * Format log entry as colored text (existing format)
 * Returns array for console.error spread operator
 */
function formatTextLog(level: LogLevel, message: string, payload?: unknown): unknown[] {
  const colorFn = levelColors[level];
  const prefix = `${LOG_PREFIX} ${level.toUpperCase()}`;
  if (payload !== undefined) {
    return [colorFn(`${prefix}: ${message}`), payload];
  }
  return [colorFn(`${prefix}: ${message}`)];
}

/**
 * Log a message with optional payload
 * Format controlled by HRM_LOG_FORMAT environment variable
 * 
 * @param level - Log severity level
 * @param message - Human-readable message
 * @param payload - Optional context data
 */
export const log = (level: LogLevel, message: string, payload?: unknown) => {
  if (level === "debug" && !isDebugEnabled()) {
    return;
  }

  if (LOG_FORMAT === "json") {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(payload !== undefined && { context: payload }),
    };
    console.error(formatJsonLog(entry));
  } else {
    const formatted = formatTextLog(level, message, payload);
    console.error(...formatted);
  }
};

/**
 * Log debug-level state information
 * Only outputs if HRM_DEBUG=true
 */
export const logState = (message: string, payload: unknown) => {
  log("debug", message, payload);
};
