import { MAX_CONTEXT_LENGTH, MAX_THOUGHT_LENGTH } from "../constants.js";

const sanitize = (value: string) => value.replace(/\s+/g, " ").trim();

export const normalizeThought = (thought?: string) => {
  if (!thought) {
    return undefined;
  }
  const cleaned = sanitize(thought);
  if (!cleaned) {
    return undefined;
  }
  return cleaned.length > MAX_THOUGHT_LENGTH
    ? `${cleaned.slice(0, MAX_THOUGHT_LENGTH - 3)}...`
    : cleaned;
};

export const appendContext = (context: string[], addition: string, limit = MAX_CONTEXT_LENGTH) => {
  const normalized = normalizeThought(addition);
  if (!normalized) {
    return context;
  }
  const nextContext = [...context, normalized];
  let totalLength = nextContext.reduce((sum, entry) => sum + entry.length, 0);
  while (nextContext.length > 1 && totalLength > limit) {
    const removed = nextContext.shift();
    if (!removed) {
      break;
    }
    totalLength -= removed.length;
  }
  return nextContext;
};

export const contextToText = (context: string[]) => context.join("\n");

export const summaryFromContext = (context: string[], fallback: string) => {
  if (!context.length) {
    return fallback;
  }
  const composite = context.join(" ");
  if (composite.length <= 280) {
    return composite;
  }
  return `${context[context.length - 1].slice(0, 160)}...`; // favour recency
};