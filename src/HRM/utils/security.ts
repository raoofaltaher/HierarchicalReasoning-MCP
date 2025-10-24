import { resolve, normalize, sep } from "node:path";
import { existsSync, statSync } from "node:fs";
import { BLOCKED_SYSTEM_PATHS } from "../constants.js";
import { log } from "./logging.js";

/**
 * Validates and sanitizes a workspace path to prevent directory traversal attacks.
 * 
 * Security measures:
 * 1. Resolves to absolute path (normalizes .. and . segments)
 * 2. Validates path exists and is a directory
 * 3. Blocks access to sensitive system directories
 * 4. Logs all workspace path access attempts for audit trail
 * 
 * @param workspacePath - User-provided workspace path
 * @returns Validated absolute path
 * @throws Error if path is invalid, doesn't exist, or accesses blocked directory
 */
export function validateWorkspacePath(workspacePath: string): string {
  if (!workspacePath || typeof workspacePath !== "string") {
    throw new Error("Workspace path must be a non-empty string");
  }

  // Normalize and resolve to absolute path (handles .., ., and relative paths)
  const absolutePath = normalize(resolve(workspacePath));

  // Security: Check if path attempts to access blocked system directories
  const isBlocked = BLOCKED_SYSTEM_PATHS.some((blockedPath) => {
    const normalizedBlocked = normalize(blockedPath);
    // Check if resolved path starts with or equals a blocked path
    return (
      absolutePath === normalizedBlocked ||
      absolutePath.startsWith(normalizedBlocked + sep)
    );
  });

  if (isBlocked) {
    log("warn", "Blocked workspace path access attempt", {
      requested: workspacePath,
      resolved: absolutePath,
      reason: "sensitive_system_directory",
    });
    throw new Error(
      "Access to system directories is not permitted for security reasons"
    );
  }

  // Validate path exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Workspace path does not exist: ${absolutePath}`);
  }

  // Validate path is a directory
  try {
    const stats = statSync(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`Workspace path is not a directory: ${absolutePath}`);
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EACCES") {
      throw new Error(
        `Permission denied accessing workspace path: ${absolutePath}`
      );
    }
    throw error;
  }

  // Log successful validation for audit trail
  log("info", "Workspace path validated", {
    requested: workspacePath,
    resolved: absolutePath,
  });

  return absolutePath;
}

/**
 * Validates thought length to prevent resource exhaustion attacks.
 * 
 * @param thought - User-provided thought string
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error messages
 * @returns Truncated thought if exceeds max length
 */
export function validateThoughtLength(
  thought: string | undefined,
  maxLength: number,
  fieldName: string
): string | undefined {
  if (!thought) {
    return thought;
  }

  if (thought.length > maxLength) {
    log("warn", `${fieldName} exceeds maximum length, truncating`, {
      original_length: thought.length,
      max_length: maxLength,
    });
    return thought.substring(0, maxLength);
  }

  return thought;
}
