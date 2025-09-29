# Hierarchical Reasoning MCP Server

Hierarchical Reasoning MCP (HRM) is a neuroscience‑inspired dual‑layer reasoning engine for the Model Context Protocol. It separates strategic planning (High level) from tactical execution (Low level), adaptively iterates based on heuristic metrics, and provides structured diagnostics for safe autonomous reasoning.

## ✨ Core Capabilities

- Hierarchical operations: `h_plan`, `l_execute`, `h_update`, `evaluate`, `halt_check`, `auto_reason`
- Adaptive reasoning metrics: confidence, convergence, complexity (heuristic composite)
- Dual halting logic: convergence threshold OR confidence plateau (window & delta tunable at runtime)
- Auto reasoning loop with structured JSON trace (textual dump optional via env flag)
- Framework-aware enrichment (React / Next.js / Express / Prisma / Postgres heuristics) when `workspace_path` provided
- Duplicate low-level thought suppression (normalized signature guard)
- Session lifecycle with TTL eviction and environment overrides
- JSON Schema validated inputs (derived automatically from Zod schema)
- Diagnostics returned on every response: plateau count + confidence window history
 - Diagnostics returned on every response: plateau count + confidence window history

## Installation

Install globally (recommended if you want the CLI on your PATH):

```bash
npm install -g hierarchical-reasoning-mcp
mcp-server-hierarchical-reasoning --help
```

Use directly with npx (no global install):

```bash
npx hierarchical-reasoning-mcp@latest
```

Add as a dev dependency:

```bash
npm install --save-dev hierarchical-reasoning-mcp
```

After installation the binary `mcp-server-hierarchical-reasoning` is available (globally or in `node_modules/.bin`).

## Usage

```bash
npm install
npm run build
npx mcp-server-hierarchical-reasoning
```

Once running, the server exposes a single MCP tool named `hierarchicalreasoning`. Provide an `operation` value and optionally supply cycle counters (`h_cycle`, `l_cycle`), thoughts, and candidate solutions to guide reasoning. Set `workspace_path` when you want framework detection (React/Next.js/Express/Prisma today). The server persists session state whenever a `session_id` is supplied.

### Quick Start

1. Install (see Installation above).

1. Run:

```bash
mcp-server-hierarchical-reasoning
```

1. Point your MCP client (Claude Desktop / VS Code integration) at the executable.

### Programmatic Launch Example

```js
import { spawn } from 'node:child_process';
const proc = spawn('mcp-server-hierarchical-reasoning', { stdio: 'inherit' });
proc.on('exit', code => console.log('HRM exited with', code));
```

### When To Use

Choose this MCP server when you need structured multi‑cycle reasoning with:

- Separation of strategic (H) and tactical (L) thinking
- Automatic iteration until convergence or plateau
- Transparent diagnostics (confidence momentum / plateau)
- Framework‑aware hints for common JS/TS stacks

It does not execute arbitrary user code or mutate the filesystem; it focuses on reasoning outputs.

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
| convergence_threshold | number (0.5–0.99) | no | (env or 0.85) | Optional; if omitted, falls back to `HRM_CONVERGENCE_THRESHOLD` / alias else 0.85 |
| h_context | string | no | – | Manually injected aggregated context override |
| l_context | string | no | – | Manually injected detailed context override |
| solution_candidates | string[] | no | – | Candidate solution list influencing evaluation |
| session_id | uuid | no | – | Persistent session key (enables state continuity) |
| reset_state | boolean | no | – | Force session reset before operation |
| workspace_path | string | no | – | Local path for framework detection heuristics |

## Auto Reasoning Trace & Halting

`auto_reason` returns:

- `trace`: structured array of steps (operation, H/L cycles, note, metrics)
- `halt_trigger`: one of `confidence_convergence`, `plateau`, `max_steps`
- `diagnostics`: uniform block also returned for non‑auto operations

Textual trace emission is suppressed by default; set `HRM_INCLUDE_TEXT_TRACE=true` to append a human‑readable trace summary to `content`.

Halting occurs when either:

1. Confidence ≥ minimum (0.8) AND convergence ≥ configured threshold (default / env / per request), or
2. A confidence plateau persists: improvement < delta across a sliding window, repeated enough times.

Plateau detection is governed by:

- Window length: `PLATEAU_WINDOW` (env override `HRM_PLATEAU_WINDOW`, 2–20)
- Improvement delta: `PLATEAU_DELTA` (env override `HRM_PLATEAU_DELTA`, 0.001–0.1)
- Required consecutive plateau confirmations: internal constant (currently 2 increments → 3 evaluations)

## Diagnostics

Every response (success or error) includes a `diagnostics` object:

```jsonc
{
  "diagnostics": {
    "plateau_count": 1,                // number of consecutive plateau confirmations
    "confidence_window": [0.10,0.11,0.12] // rolling confidence scores retained for plateau logic
  }
}
```

Use these values to visualize momentum, adapt UI prompts, or trigger client‑side interventions.

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

Implemented:

| Variable | Effect |
|----------|--------|
| HRM_CONVERGENCE_THRESHOLD / HRM_CONFIDENCE_THRESHOLD | Default convergence threshold if request omits `convergence_threshold` (0.5–0.99) |
| HRM_SESSION_TTL_MS | Session eviction window (ms) |
| HRM_PLATEAU_WINDOW | Sliding window length for plateau detection (2–20, default 3) |
| HRM_PLATEAU_DELTA | Minimum confidence improvement to avoid plateau (0.001–0.1, default 0.02) |
| HRM_INCLUDE_TEXT_TRACE | When `true`, append human‑readable auto reasoning trace to response content |

Planned:

| Variable | Purpose |
|----------|---------|
| HRM_MAX_AUTO_STEPS | External cap for auto reasoning total steps (future wiring) |



## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information about contributing to this repository.

## 🔒 Security

See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Community

- [GitHub Discussions](https://github.com/raoofaltaher/discussions)

## ⭐ Support

If you find MCP servers useful, please consider starring the repository and contributing new servers or improvements!

## Citation

This repository is used to develop a new experimental MCP server implementation based on the method described in:

```bibtex
@misc{wang2025hierarchicalreasoningmodel,
      title={Hierarchical Reasoning Model}, 
      author={Guan Wang and Jin Li and Yuhao Sun and Xing Chen and Changling Liu and Yue Wu and Meng Lu and Sen Song and Yasin Abbasi Yadkori},
      year={2025},
      eprint={2506.21734},
      archivePrefix={arXiv},
      primaryClass={cs.AI},
      url={https://arxiv.org/abs/2506.21734}, 
}
```
