#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  ZodArray,
  ZodBoolean,
  ZodDefault,
  ZodEffects,
  ZodEnum,
  ZodError,
  ZodFirstPartyTypeKind,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  type ZodTypeAny,
} from "zod";

import { HierarchicalReasoningEngine } from "./engine.js";
import { HRMParametersSchema } from "./types.js";
import { log } from "./utils/logging.js";

const engine = new HierarchicalReasoningEngine();

type ToolInputSchema = Tool["inputSchema"];
type JsonSchema = Record<string, unknown>;

const unwrapEffects = (schema: ZodTypeAny): ZodTypeAny => {
  if (schema instanceof ZodEffects) {
    return unwrapEffects(schema._def.schema);
  }
  return schema;
};

const toJsonSchema = (schema: ZodTypeAny): { schema: JsonSchema; optional: boolean } => {
  const unwrapped = unwrapEffects(schema);
  if (unwrapped instanceof ZodOptional) {
    const inner = toJsonSchema(unwrapped.unwrap());
    return { schema: inner.schema, optional: true };
  }
  if (unwrapped instanceof ZodDefault) {
    const inner = toJsonSchema(unwrapped._def.innerType);
    const defaultValue = unwrapped._def.defaultValue();
    if (defaultValue !== undefined) {
      inner.schema = { ...inner.schema, default: defaultValue };
    }
    return { schema: inner.schema, optional: true };
  }

  switch (unwrapped._def.typeName) {
    case ZodFirstPartyTypeKind.ZodString: {
      const json: JsonSchema = { type: "string" };
      for (const check of (unwrapped as ZodString)._def.checks) {
        if (check.kind === "uuid") {
          json.format = "uuid";
        }
        if (check.kind === "min") {
          json.minLength = check.value;
        }
        if (check.kind === "max") {
          json.maxLength = check.value;
        }
      }
      return { schema: json, optional: false };
    }
    case ZodFirstPartyTypeKind.ZodNumber: {
      const json: JsonSchema = { type: "number" };
      for (const check of (unwrapped as ZodNumber)._def.checks) {
        switch (check.kind) {
          case "int":
            json.type = "integer";
            break;
          case "min":
            if (check.inclusive) {
              json.minimum = check.value;
            } else {
              json.exclusiveMinimum = check.value;
            }
            break;
          case "max":
            if (check.inclusive) {
              json.maximum = check.value;
            } else {
              json.exclusiveMaximum = check.value;
            }
            break;
          case "multipleOf":
            json.multipleOf = check.value;
            break;
        }
      }
      return { schema: json, optional: false };
    }
    case ZodFirstPartyTypeKind.ZodBoolean:
      return { schema: { type: "boolean" }, optional: false };
    case ZodFirstPartyTypeKind.ZodEnum:
      return {
        schema: { type: "string", enum: [...(unwrapped as ZodEnum<[string, ...string[]]>)._def.values] },
        optional: false,
      };
    case ZodFirstPartyTypeKind.ZodArray: {
      const arrayType = (unwrapped as ZodArray<any>)._def.type;
      const inner = toJsonSchema(arrayType);
      return { schema: { type: "array", items: inner.schema }, optional: false };
    }
    case ZodFirstPartyTypeKind.ZodObject: {
      return { schema: buildObjectSchema(unwrapped as ZodObject<any>), optional: false };
    }
    default:
      return { schema: {}, optional: false };
  }
};

const buildObjectSchema = (schema: ZodObject<any>): JsonSchema => {
  const shape = schema.shape;
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const [key, value] of Object.entries(shape)) {
    const { schema: propSchema, optional } = toJsonSchema(value as ZodTypeAny);
    properties[key] = propSchema;
    if (!optional) {
      required.push(key);
    }
  }
  const result: JsonSchema = {
    type: "object",
    properties,
    additionalProperties: false,
  };
  if (required.length) {
    result.required = required;
  }
  return result;
};

const { schema: topLevelSchema } = toJsonSchema(HRMParametersSchema);
if (!topLevelSchema || topLevelSchema.type !== "object") {
  throw new Error("HRMParametersSchema must resolve to an object JSON schema.");
}
const hrmInputSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "HRMParameters",
  ...(topLevelSchema as Record<string, unknown>),
};
const HRM_INPUT_SCHEMA = hrmInputSchema as unknown as ToolInputSchema;

const HRM_TOOL: Tool = {
  name: "hierarchicalreasoning",
  description: "Neuroscience-inspired hierarchical reasoning engine with adaptive cycles and convergence feedback.",
  inputSchema: HRM_INPUT_SCHEMA,
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
    const result = await engine.handleRequest(parsed);
    
    // Map HRMResponse to CallToolResult (MCP SDK expected type)
    return {
      content: result.content,
      isError: result.isError ?? false,
    };
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


