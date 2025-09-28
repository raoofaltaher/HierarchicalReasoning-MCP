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

## Parameters

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| operation | enum(`h_plan`,`l_execute`,`h_update`,`evaluate`,`halt_check`,`auto_reason`) | yes | – | Core operation selector |
| h_thought | string | no | – | High-level strategic thought input |
| l_thought | string | no | – | Low-level tactical thought input |
| problem | string | no | – | Problem statement / goal framing |
| h_cycle | integer >=0 | no | 0 | Current high-level cycle index (auto-managed) |
| l_cycle | integer >=0 | no | 0 | Current low-level cycle index (auto-managed) |
| max_l_cycles_per_h | integer (1–20) | no | 3 | Limit of L cycles inside one H cycle |
| max_h_cycles | integer (1–20) | no | 4 | Maximum high-level cycles (auto reasoning) |
| confidence_score | number (0–1) | no | – | External confidence signal (optional) |
| complexity_estimate | number (1–10) | no | – | External complexity hint for adaptive pacing |
| convergence_threshold | number (0.5–0.99) | no | 0.85 | Threshold for halting via confidence/convergence |
| h_context | string | no | – | Manually injected aggregated context override |
| l_context | string | no | – | Manually injected detailed context override |
| solution_candidates | string[] | no | – | Candidate solution list influencing evaluation |
| session_id | uuid | no | – | Persistent session key (enables state continuity) |
| reset_state | boolean | no | – | Force session reset before operation |
| workspace_path | string | no | – | Local path for framework detection heuristics |

## Auto Reasoning Trace

`auto_reason` will return a `trace` array with each step's operation, cycle indices, note, and metrics. A `halt_trigger` field indicates why the loop stopped: `confidence_convergence`, `plateau`, or `max_steps`.

## Environment Variables (Planned Overrides)

Upcoming support (not yet active) for:

| Variable | Purpose |
|----------|---------|
| HRM_CONFIDENCE_THRESHOLD | Override default convergence threshold |
| HRM_CONVERGENCE_THRESHOLD | Alias / future decomposition override |
| HRM_MAX_AUTO_STEPS | Cap for auto reasoning steps |

## VS Code / MCP Client Integration

Example Claude Desktop config:

```json
{
	"mcpServers": {
		"hierarchicalreasoning": {
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-hierarchical-reasoning"],
			"env": { "HRM_DEBUG": "true" }
		}
	}
}
```

Local (unpublished) build reference:

```json
{
	"mcpServers": {
		"hierarchicalreasoning": {
			"command": "node",
			"args": ["/ABSOLUTE/PATH/TO/src/HRM/dist/index.js"]
		}
	}
}
```

## Example Calls

High-level plan:

```json
{ "operation": "h_plan", "h_thought": "Outline refactor strategy", "problem": "Improve modularity" }
```

Auto reasoning:

```json
{ "operation": "auto_reason", "problem": "Design scalable plugin system", "session_id": "<uuid>" }
```

## Development

- `npm run build` compiles TypeScript to `dist/`
- `npm run watch` starts the TypeScript compiler in watch mode
- Set `HRM_DEBUG=true` to enable verbose logging

### Local Run & Test

```bash
npm install
npm test
npm run build
npx mcp-server-hierarchical-reasoning
```

### Environment Variable Overrides

Currently honored:

| Variable | Effect |
|----------|--------|
| HRM_CONVERGENCE_THRESHOLD / HRM_CONFIDENCE_THRESHOLD | Sets default `convergence_threshold` if not provided in request (0.5–0.99) |
| HRM_SESSION_TTL_MS | Override session TTL eviction window |

Planned:

| Variable | Purpose |
|----------|---------|
| HRM_MAX_AUTO_STEPS | External cap for auto reasoning total steps (future wiring) |

## License

MIT

