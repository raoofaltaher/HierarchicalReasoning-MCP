#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ZodError } from "zod";

import { HierarchicalReasoningEngine } from "./engine.js";
import { HRMParametersSchema } from "./types.js";
import { log } from "./utils/logging.js";

const engine = new HierarchicalReasoningEngine();

const HRM_TOOL: Tool = {
  name: "hierarchicalreasoning",
  description: "Neuroscience-inspired hierarchical reasoning engine with adaptive cycles and convergence feedback.",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["h_plan", "l_execute", "h_update", "evaluate", "halt_check", "auto_reason"],
        description: "The reasoning operation to execute",
      },
      h_thought: {
        type: "string",
        description: "High-level strategic thought content",
      },
      l_thought: {
        type: "string",
        description: "Low-level detailed thought content",
      },
      problem: {
        type: "string",
        description: "Problem statement used for auto reasoning mode",
      },
      h_cycle: {
        type: "integer",
        minimum: 0,
        description: "Current high-level cycle index",
      },
      l_cycle: {
        type: "integer",
        minimum: 0,
        description: "Current low-level cycle index",
      },
      max_l_cycles_per_h: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Maximum low-level cycles per high-level cycle",
      },
      max_h_cycles: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Maximum high-level cycles",
      },
      confidence_score: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Manual confidence override for evaluation",
      },
      complexity_estimate: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description: "Problem complexity estimate",
      },
      convergence_threshold: {
        type: "number",
        minimum: 0.5,
        maximum: 0.99,
        description: "Required convergence score for halting",
      },
      h_context: {
        type: "string",
        description: "Persisted high-level context snapshot",
      },
      l_context: {
        type: "string",
        description: "Persisted low-level context snapshot",
      },
      solution_candidates: {
        type: "array",
        items: { type: "string" },
        description: "Candidate solution list",
      },
      session_id: {
        type: "string",
        description: "Session identifier for state persistence",
      },
      reset_state: {
        type: "boolean",
        description: "Reset server-side session state",
      },
    },
    required: ["operation"],
    additionalProperties: false,
  },
};

const server = new Server(
  {
    name: "hierarchical-reasoning-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [HRM_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "hierarchicalreasoning") {
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
      isError: true,
    };
  }

  try {
    const parsed = HRMParametersSchema.parse(request.params.arguments ?? {});
    return engine.handleRequest(parsed) as any;
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        content: [
          {
            type: "text",
            text: `Validation failed: ${error.errors.map((issue) => issue.message).join(", ")}`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("info", "Hierarchical Reasoning MCP server running on stdio");
}

runServer().catch((error) => {
  log("error", "Fatal error running server", error);
  process.exit(1);
});


