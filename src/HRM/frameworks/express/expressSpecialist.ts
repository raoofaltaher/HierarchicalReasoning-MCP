import { ReasoningPattern } from "../types.js";

export interface ExpressReasoningResult {
  framework: "express";
  reasoning: string[];
  patterns: ReasoningPattern[];
  recommendations: string[];
  codeExamples: string[];
}

const EXPRESS_PATTERNS: ReasoningPattern[] = [
  {
    name: "Route Composition",
    description: "Compose the Express application from modular routers and middleware layers.",
    guidance: "Group routes by bounded context, mount with versioned prefixes, and order middleware intentionally.",
    examples: ["app.use('/v1/users', usersRouter);"]
  },
  {
    name: "Async Error Handling",
    description: "Wrap async handlers to surface rejected promises to the error middleware.",
    guidance: "Use a helper like wrapAsync(fn) => (req,res,next)=>fn(req,res,next).catch(next).",
  },
  {
    name: "Security Middleware",
    description: "Harden Express apps with helmet, rate limiting, and input sanitization.",
    guidance: "Apply helmet(), express-rate-limit, and celebrate/joi validation before business logic.",
  },
];

export class ExpressFrameworkSpecialist {
  async generate(problem?: string): Promise<ExpressReasoningResult> {
    const reasoning: string[] = ["Express detected — prioritizing RESTful structure and middleware hygiene."];
    if (problem) {
      reasoning.push(`Problem context: ${problem}`);
    }

    const recommendations: string[] = [
      "Separate transport and business logic: keep controllers thin, delegate to services.",
      "Validate inbound payloads close to the edge to limit attack surface.",
      "Instrument endpoints with request IDs and structured logging.",
    ];

    if (problem?.toLowerCase().includes("auth")) {
      recommendations.push("Centralize authentication and authorization middleware with explicit scopes.");
    }

    const codeExamples = [
      "const router = Router();\nrouter.get('/health', (_req, res) => res.json({ ok: true }));\napp.use('/api', router);",
      "app.use((err, _req, res, _next) => {\n  logger.error(err);\n  res.status(500).json({ error: 'Internal Server Error' });\n});",
    ];

    return {
      framework: "express",
      reasoning,
      patterns: EXPRESS_PATTERNS,
      recommendations,
      codeExamples,
    };
  }
}
