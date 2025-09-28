import chalk from "chalk";
import { LOG_PREFIX } from "../constants.js";

export type LogLevel = "info" | "warn" | "error" | "debug";

const levelColors = {
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
  debug: chalk.gray,
} as const;

const isDebugEnabled = () => (process.env.HRM_DEBUG || "").toLowerCase() === "true";

export const log = (level: LogLevel, message: string, payload?: unknown) => {
  if (level === "debug" && !isDebugEnabled()) {
    return;
  }
  const colorFn = levelColors[level];
  const prefix = `${LOG_PREFIX} ${level.toUpperCase()}`;
  if (payload) {
    console.error(colorFn(`${prefix}: ${message}`), payload);
  } else {
    console.error(colorFn(`${prefix}: ${message}`));
  }
};

export const logState = (message: string, payload: unknown) => {
  log("debug", message, payload);
};
