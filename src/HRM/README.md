# Hierarchical Reasoning MCP Server

The Hierarchical Reasoning MCP server implements a neuroscience-inspired dual-layer reasoning model for Model Context Protocol tooling. It separates strategic planning (H-level) and tactical execution (L-level), adapts reasoning depth to task complexity, and provides convergence metrics to guide halting decisions.

## Features

- Hierarchical operations: `h_plan`, `l_execute`, `h_update`, `evaluate`, `halt_check`, and `auto_reason`
- Persistent session state with configurable convergence thresholds and cycle budgets
- Adaptive metrics (confidence, convergence, complexity) powering halting guidance
- Auto-reasoning mode that loops through hierarchical cycles with trace export
- Framework-aware reasoning via optional `workspace_path` input (React/Next.js heuristics, specialized patterns)
- JSON-schema validated inputs backed by Zod runtime parsing

## Usage

```bash
npm install
npm run build
npx mcp-server-hierarchical-reasoning
```

Once running, the server exposes a single MCP tool named  `hierarchicalreasoning`. Provide an `operation` value and optionally supply cycle counters (`h_cycle`, `l_cycle`), thoughts, and candidate solutions to guide reasoning. Set `workspace_path` when you want framework detection (React/Next.js/Express/Prisma today). The server persists session state whenever a `session_id` is supplied. 

## Development

- `npm run build` compiles TypeScript to `dist/`
- `npm run watch` starts the TypeScript compiler in watch mode
- Set `HRM_DEBUG=true` to enable verbose logging

## License

MIT

