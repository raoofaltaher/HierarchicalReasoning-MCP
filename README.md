# Hierarchical Reasoning MCP Server

![Tests](https://github.com/raoofaltaher/HierarchicalReasoning-MCP/actions/workflows/typescript.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

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

## 📚 Core Concepts

### Hierarchical Reasoning Model

HRM implements a two-layer reasoning architecture inspired by neuroscience and cognitive frameworks:

**High-Level (H) Layer**: Strategic planning and synthesis

- Aggregates insights from multiple low-level cycles
- Maintains broad context and goal alignment
- Generates strategic decisions and direction
- Stored in `h_context` field

**Low-Level (L) Layer**: Tactical execution and detail exploration

- Decomposes problems into actionable steps
- Explores implementation details and edge cases
- Generates concrete solutions and candidates
- Stored in `l_context` field

**Multi-Cycle Workflow**:

1. H-layer plans strategic approach (`h_plan`)
2. L-layer executes tactical steps (`l_execute`, up to `max_l_cycles_per_h` iterations)
3. H-layer synthesizes L-layer findings (`h_update`)
4. Evaluation assesses convergence (`evaluate`)
5. Halting logic determines continuation (`halt_check`)
6. Cycle repeats until convergence or plateau

This separation allows focused attention at each level while maintaining coherent overall reasoning.

### Convergence & Plateau Detection

**Convergence Metrics** (heuristic composite):

- **High-level coverage**: Breadth of H-context (0-35% weight)
- **Low-level depth**: Detail richness in L-context (0-35% weight)
- **Candidate strength**: Quality of solution candidates (0-20% weight)
- **Diversity**: Variety of explored approaches (0-10% weight)

Combined score ranges 0.0–1.0. Higher values indicate more complete reasoning.

**Halting Triggers**:

1. **Confidence + Convergence**:
   - Confidence ≥ 0.8 (minimum threshold)
   - Convergence ≥ configured threshold (default 0.85, override via `HRM_CONVERGENCE_THRESHOLD` or request parameter)

2. **Plateau Detection**:
   - Tracks confidence improvements in sliding window (default size: 3)
   - If improvement < delta (default: 0.02) for consecutive evaluations, plateau detected
   - Prevents infinite loops on stagnant reasoning
   - Tunable via `HRM_PLATEAU_WINDOW` (2–20) and `HRM_PLATEAU_DELTA` (0.001–0.1)

**Diagnostics** returned on every response:

```json
{
  "diagnostics": {
    "plateau_count": 2,
    "confidence_window": [0.78, 0.79, 0.79]
  }
}
```

Use these to monitor reasoning momentum and adjust thresholds if needed.

### Framework Detection

When `workspace_path` is provided, HRM automatically detects frameworks and enriches reasoning with domain-specific patterns.

**Detection Pipeline**:

1. **Package Analysis**: Parse `package.json` (dependencies, devDependencies)
2. **Workspace Analysis**: Scan file structure, identify common patterns
3. **Code Pattern Analysis**: Detect framework-specific code signatures (optional, default: enabled)
4. **Confidence Scoring**: Weight indicators, filter by minimum threshold (0.35)
5. **Pattern Injection**: Enrich H/L contexts with top 6 recommended patterns

**Supported Frameworks** (confidence threshold: 0.35):

- **React**: Component model, hooks, JSX patterns
- **Next.js**: App/Pages router, SSR/SSG, API routes
- **Vue.js**: Composition API, SFC patterns, reactivity
- **Angular**: Dependency injection, signals, standalone components
- **Express**: Middleware, routing, error handling
- **NestJS**: Modules, decorators, DI, backend patterns
- **Prisma**: Schema design, migrations, relations
- **PostgreSQL**: Query optimization, indexing strategies

**Placeholder Detectors** (low confidence, future enhancement):

- Fastify, MongoDB, MySQL, TypeORM

Framework detection is transparent—diagnostics show which frameworks were detected and their confidence scores.

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
    "confidence_window": [0.10,0.11,0.12], // rolling confidence scores retained for plateau logic
    "performance": {                   // optional: timing and thought metrics (added v0.1.0)
      "totalDuration": 123.45,         // total ms for auto_reason (if applicable)
      "cycleDurations": [2.3, 1.8, 2.1], // ms per operation cycle
      "avgCycleDuration": 2.07,        // mean cycle time
      "hThoughtLengths": [120, 145],   // characters per h_thought
      "lThoughtLengths": [89, 92, 95], // characters per l_thought
      "avgHThoughtLength": 132.5,      // mean h_thought length
      "avgLThoughtLength": 92.0,       // mean l_thought length
      "contextGrowthRatios": [0.15, 0.08], // context size growth per cycle
      "avgContextGrowth": 0.115,       // mean growth ratio
      "totalCycles": 5                 // total operations executed
    }
  }
}
```

**Interpreting Performance Metrics** (optional, <2% overhead):

- **Cycle Durations**: Measure operation execution time—helps identify slow cycles (typically <5ms for simple operations, <50ms for complex auto_reason steps).
- **Thought Lengths**: Track verbosity—unusually long thoughts (>500 chars) may indicate excessive detail; very short (<50 chars) may suggest superficial reasoning.
- **Context Growth**: Monitor retention efficiency—high growth (>0.5 ratio) signals accumulating context; near-zero suggests plateauing insights.
- **Total Cycles**: Count operations in session—useful for billing, quotas, or detecting runaway auto_reason loops.

Use these values to visualize momentum, adapt UI prompts, trigger client‑side interventions, or optimize reasoning parameters.

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

## 🔧 Operations Reference

HRM exposes a single MCP tool (`hierarchicalreasoning`) with six operations. Each operation serves a specific role in the reasoning cycle.

### h_plan

**Purpose**: Strategic planning and goal framing at the high level.

**When to use**:

- Starting a new reasoning session
- Defining overall strategy or approach
- Setting direction after completing low-level exploration

**Key inputs**:

- `operation`: `"h_plan"`
- `h_thought`: Strategic insight or planning statement
- `problem`: Problem statement or goal (recommended)
- `session_id`: UUID for session continuity (optional)

**Returns**:

- `content`: Confirmation of planning step
- `h_context`: Updated high-level context
- `diagnostics`: Plateau count and confidence window

**Example**:

```json
{
  "operation": "h_plan",
  "h_thought": "Break problem into authentication, data layer, and API modules",
  "problem": "Design a secure user management system",
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response excerpt**:

```json
{
  "content": "High-level plan recorded...",
  "h_context": "Break problem into authentication, data layer, and API modules",
  "diagnostics": { "plateau_count": 0, "confidence_window": [] }
}
```

---

### l_execute

**Purpose**: Tactical execution and detailed exploration at the low level.

**When to use**:

- After `h_plan` to explore implementation details
- Decomposing tasks into concrete steps
- Generating solution candidates

**Key inputs**:

- `operation`: `"l_execute"`
- `l_thought`: Tactical step or implementation detail
- `l_cycle`: Current low-level cycle index (auto-incremented)
- `session_id`: UUID for session continuity

**Returns**:

- `content`: Confirmation of execution step
- `l_context`: Updated low-level context
- `l_cycle`: Incremented cycle counter
- `diagnostics`: Plateau count and confidence window

**Example**:

```json
{
  "operation": "l_execute",
  "l_thought": "Implement JWT token generation with 24h expiry",
  "l_cycle": 0,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Duplicate suppression**: If the same normalized thought is submitted twice, it's silently ignored to prevent loops.

---

### h_update

**Purpose**: Synthesize findings from low-level cycles back into high-level strategy.

**When to use**:

- After completing multiple `l_execute` cycles
- Aggregating tactical insights into strategic understanding
- Before running `evaluate` to assess convergence

**Key inputs**:

- `operation`: `"h_update"`
- `h_thought`: Synthesis or aggregation insight
- `h_cycle`: Current high-level cycle index
- `session_id`: UUID for session continuity

**Returns**:

- `content`: Confirmation of synthesis
- `h_context`: Updated with synthesis
- `h_cycle`: Incremented cycle counter
- `diagnostics`: Plateau count and confidence window

**Example**:

```json
{
  "operation": "h_update",
  "h_thought": "Auth module complete; focus next on database schema design",
  "h_cycle": 0,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### evaluate

**Purpose**: Assess reasoning progress using convergence metrics.

**When to use**:

- After `h_update` to measure completeness
- Before `halt_check` to inform stopping decision
- Periodically during long reasoning sessions

**Key inputs**:

- `operation`: `"evaluate"`
- `solution_candidates`: Array of candidate solutions (optional, influences scoring)
- `session_id`: UUID for session continuity

**Returns**:

- `content`: Evaluation summary
- `confidence_score`: Composite confidence (0–1)
- `convergence_score`: Heuristic convergence metric (0–1)
- `complexity_estimate`: Estimated problem complexity (1–10)
- `diagnostics`: **Updated confidence window** for plateau detection

**Example**:

```json
{
  "operation": "evaluate",
  "solution_candidates": ["JWT auth with refresh tokens", "Session-based auth"],
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response excerpt**:

```json
{
  "content": "Evaluation complete...",
  "confidence_score": 0.82,
  "convergence_score": 0.75,
  "complexity_estimate": 6,
  "diagnostics": {
    "plateau_count": 0,
    "confidence_window": [0.70, 0.78, 0.82]
  }
}
```

---

### halt_check

**Purpose**: Determine whether reasoning should continue or terminate.

**When to use**:

- After `evaluate` to decide on continuation
- Manual check during interactive reasoning
- Before committing to a solution

**Key inputs**:

- `operation`: `"halt_check"`
- `confidence_score`: Current confidence (from `evaluate`)
- `convergence_threshold`: Optional override (0.5–0.99)
- `session_id`: UUID for session continuity

**Returns**:

- `content`: Halt decision explanation
- `should_halt`: Boolean decision
- `halt_trigger`: Reason if halting (`"confidence_convergence"`, `"plateau"`, or `null`)
- `diagnostics`: Plateau count and confidence window

**Example**:

```json
{
  "operation": "halt_check",
  "confidence_score": 0.82,
  "convergence_threshold": 0.80,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response excerpt** (halting):

```json
{
  "content": "Confidence (0.82) and convergence (0.87) exceed thresholds. Halting.",
  "should_halt": true,
  "halt_trigger": "confidence_convergence",
  "diagnostics": { "plateau_count": 0, "confidence_window": [0.82] }
}
```

**Response excerpt** (continuing):

```json
{
  "content": "Convergence below threshold. Continue reasoning.",
  "should_halt": false,
  "halt_trigger": null,
  "diagnostics": { "plateau_count": 1, "confidence_window": [0.70, 0.72] }
}
```

---

### auto_reason

**Purpose**: Fully autonomous reasoning loop with automatic halting.

**When to use**:

- Complex problems requiring multiple cycles
- When you want structured trace of reasoning steps
- Delegating multi-step problem-solving to the server

**Key inputs**:

- `operation`: `"auto_reason"`
- `problem`: Problem statement or goal (required)
- `workspace_path`: Path for framework detection (optional)
- `max_h_cycles`: Limit high-level cycles (default: 4, range: 1–20)
- `max_l_cycles_per_h`: Limit low-level cycles per H cycle (default: 3, range: 1–20)
- `convergence_threshold`: Override default threshold (optional, 0.5–0.99)
- `session_id`: UUID for session continuity (optional, auto-generated if omitted)

**Returns**:

- `content`: Summary of reasoning process
- `trace`: Structured array of reasoning steps (operation, cycles, metrics)
- `halt_trigger`: Termination reason (`"confidence_convergence"`, `"plateau"`, `"max_steps"`)
- `h_context`: Final high-level synthesis
- `l_context`: Final low-level details
- `solution_candidates`: Generated solutions (if any)
- `diagnostics`: Final plateau count and confidence window

**Trace structure**:

```typescript
{
  operation: string;      // e.g., "h_plan", "l_execute"
  h_cycle: number;
  l_cycle: number;
  note: string;           // Human-readable step description
  confidence?: number;    // If from evaluate step
  convergence?: number;   // If from evaluate step
}[]
```

**Example**:

```json
{
  "operation": "auto_reason",
  "problem": "Design a React dashboard with real-time data",
  "workspace_path": "/home/user/projects/dashboard",
  "max_h_cycles": 3,
  "convergence_threshold": 0.80,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response excerpt**:

```json
{
  "content": "Auto reasoning complete. Halted via confidence_convergence.",
  "trace": [
    { "operation": "h_plan", "h_cycle": 0, "l_cycle": 0, "note": "Initial planning" },
    { "operation": "l_execute", "h_cycle": 0, "l_cycle": 0, "note": "Detail exploration" },
    { "operation": "evaluate", "h_cycle": 0, "l_cycle": 0, "note": "Assessment", "confidence": 0.75, "convergence": 0.70 },
    { "operation": "halt_check", "h_cycle": 0, "l_cycle": 0, "note": "Continue" },
    { "operation": "h_update", "h_cycle": 1, "l_cycle": 0, "note": "Synthesis" },
    { "operation": "evaluate", "h_cycle": 1, "l_cycle": 0, "note": "Final assessment", "confidence": 0.85, "convergence": 0.88 }
  ],
  "halt_trigger": "confidence_convergence",
  "h_context": "Dashboard with React + WebSocket data stream...",
  "l_context": "Use zustand for state, react-query for caching...",
  "solution_candidates": ["Real-time zustand store", "SWR with polling"],
  "diagnostics": {
    "plateau_count": 0,
    "confidence_window": [0.75, 0.85]
  }
}
```

**Framework enrichment** (when `workspace_path` provided):
If React is detected, reasoning contexts will include React-specific patterns:

- "Use hooks for state management"
- "Memoize expensive components with React.memo"
- "Test with React Testing Library"

**Textual trace** (optional):
Set `HRM_INCLUDE_TEXT_TRACE=true` to append human-readable trace to `content` field.

---

## 🎨 Framework Detection Deep Dive

### Detection Pipeline

When `workspace_path` is provided to any operation, HRM automatically analyzes the project and enriches reasoning with framework-specific guidance.

**3-Step Pipeline**:

1. **Package Analysis**
   - Parse `package.json` in workspace root
   - Extract `dependencies`, `devDependencies`, `peerDependencies`
   - Identify installed frameworks and libraries

2. **Workspace Analysis**
   - Scan directory structure for common patterns
   - Detect framework-specific folders (e.g., `src/components` for React)
   - Build file tree for pattern matching

3. **Code Pattern Analysis** (optional, enabled by default)
   - Search for framework-specific code signatures
   - Detect component definitions, decorators, hooks usage
   - Identify architectural patterns

4. **Confidence Scoring**
   - Each detector evaluates indicators with weights
   - Calculate composite confidence score (0.0–1.0)
   - Filter frameworks with confidence ≥ **0.35** (minimum threshold)

5. **Pattern Injection**
   - Extract top 6 recommended patterns (deduplicated)
   - Inject into `h_context` and `l_context` as guidance
   - Prioritize patterns by framework confidence

**Performance**: Analysis runs in parallel. Typical workspace scan: 100–300ms.

### Supported Frameworks

| Framework | Min Confidence | Key Indicators (Weight) | Capabilities |
|-----------|----------------|-------------------------|--------------|
| **React** | 0.35 | `react` dep (0.4), `react-dom` dep (0.25), `src/components` folder (0.15), React component pattern (0.2) | UI (hooks, JSX), State management (Context API), Testing (RTL) |
| **Next.js** | 0.35 | `next` dep (0.5), `pages/` or `app/` folder (0.3), Next.js config (0.2) | Routing (App/Pages router), Rendering (SSR/SSG), API routes |
| **Vue.js** | 0.35 | `vue` dep (0.4), `.vue` files (0.3), Vue component pattern (0.3) | Composition API, SFC patterns, Reactivity system |
| **Angular** | 0.35 | `@angular/core` dep (0.4), `*.component.ts` files (0.3), Angular decorators (0.3) | Dependency injection, Signals, Standalone components |
| **Express** | 0.35 | `express` dep (0.5), middleware pattern (0.3), `app.listen` pattern (0.2) | Middleware, Routing, Error handling |
| **NestJS** | 0.35 | `@nestjs/core` dep (0.5), `*.module.ts` files (0.25), NestJS decorators (0.25) | Modules, Decorators, DI, Backend patterns |
| **Prisma** | 0.35 | `@prisma/client` dep (0.4), `prisma/schema.prisma` file (0.4), Prisma client usage (0.2) | Schema design, Migrations, Relations |
| **PostgreSQL** | 0.35 | `pg` or `postgres` dep (0.5), SQL files (0.25), connection patterns (0.25) | Query optimization, Indexing, Transactions |

**Placeholder Detectors** (low implementation, future enhancement):

- Fastify, MongoDB, MySQL, TypeORM

### Confidence Scoring Example

**React Detection**:

```typescript
// Indicators (from reactDetector.ts)
{
  type: "dependency", pattern: "react", weight: 0.4, matched: true
} // +0.4
{
  type: "dependency", pattern: "react-dom", weight: 0.25, matched: true
} // +0.25
{
  type: "file_pattern", pattern: "src/components", weight: 0.15, matched: true
} // +0.15
{
  type: "code_pattern", pattern: "react_component", weight: 0.2, matched: false
} // +0.0

// Total confidence: 0.4 + 0.25 + 0.15 = 0.80
// Result: React detected with high confidence
```

**Threshold filtering**: Only frameworks with confidence ≥ 0.35 are included.

### Pattern Enrichment

Detected frameworks contribute **recommended patterns** injected into reasoning contexts.

**React Pattern Example**:

```typescript
{
  name: "Hook-based State Management",
  description: "Use React hooks to manage local and shared state effectively.",
  guidance: "Prefer useReducer for complex state transitions and useContext for shared state.",
  examples: ["const [state, dispatch] = useReducer(reducer, initialState);"]
}
```

**NestJS Pattern Example**:

```typescript
{
  name: "Controller-Service Pattern",
  description: "Separate HTTP handling from business logic using NestJS architecture.",
  guidance: "Controllers handle requests, services contain business logic, repositories manage data.",
  examples: [
    "@Controller('users')",
    "@Injectable() export class UsersService { ... }"
  ]
}
```

**Injection mechanism**:

- Top 6 patterns (across all detected frameworks) are selected
- Patterns are deduplicated by name
- Injected as bullet points in `h_context`: "Framework guidance: ..."
- Available during all operations (`h_plan`, `l_execute`, `auto_reason`, etc.)

**Disabling detection**:
Omit `workspace_path` parameter to skip framework analysis entirely.

---

## 📖 Tutorials

### Tutorial 1: Building a React Dashboard with HRM

This tutorial demonstrates hierarchical reasoning applied to designing a real-time React dashboard, showcasing framework detection, multi-cycle reasoning, and diagnostics interpretation.

**Scenario**: Design a React dashboard that displays real-time stock prices with WebSocket updates.

#### Step 1: Initial Planning with Framework Detection

*Request*:

```json
{
  "operation": "auto_reason",
  "problem": "Design a React dashboard for real-time stock prices with WebSocket updates. Include state management, real-time data streaming, and chart visualization.",
  "workspace_path": "/home/user/projects/stock-dashboard",
  "max_h_cycles": 3,
  "convergence_threshold": 0.80,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Framework Detection** (automatic):

- Detects React (confidence: 0.85) via `react` dependency and `src/components/` folder
- Injects React patterns:
  - "Hook-based State Management: Prefer useReducer for complex state"
  - "Memoization Patterns: Use useMemo to prevent unnecessary renders"
  - "Context Segmentation: Split context providers to minimize re-renders"

*Response excerpt*:

```json
{
  "content": "Auto reasoning complete. Halted via confidence_convergence.",
  "trace": [
    {
      "operation": "h_plan",
      "h_cycle": 0,
      "l_cycle": 0,
      "note": "Initial planning with React patterns"
    },
    {
      "operation": "l_execute",
      "h_cycle": 0,
      "l_cycle": 0,
      "note": "Explore WebSocket integration with React"
    },
    {
      "operation": "l_execute",
      "h_cycle": 0,
      "l_cycle": 1,
      "note": "Design state management with useReducer"
    },
    {
      "operation": "h_update",
      "h_cycle": 1,
      "l_cycle": 0,
      "note": "Synthesize: WebSocket → reducer → chart components"
    },
    {
      "operation": "evaluate",
      "h_cycle": 1,
      "l_cycle": 0,
      "note": "Assessment",
      "confidence": 0.82,
      "convergence": 0.85
    }
  ],
  "halt_trigger": "confidence_convergence",
  "h_context": "Architecture: WebSocket hook → useReducer for state → memoized chart components. Use React.memo on PriceChart to prevent re-renders on every tick.",
  "l_context": "Implementation details: (1) Custom useWebSocket hook manages connection lifecycle. (2) Reducer handles ADD_PRICE, UPDATE_PRICE, CLEAR_PRICES actions. (3) Chart library: recharts with useMemo for data transformation. (4) Context provider for WebSocket connection shared across dashboard widgets.",
  "solution_candidates": [
    "useReducer + Context API for global state",
    "Zustand store for simpler state management",
    "React Query with WebSocket plugin"
  ],
  "diagnostics": {
    "plateau_count": 0,
    "confidence_window": [0.70, 0.78, 0.82]
  }
}
```

**Interpretation**:

- **Trace**: 5 steps (plan → 2 executes → update → evaluate)
- **Halt trigger**: `confidence_convergence` (healthy completion)
- **Diagnostics**: `confidence_window` shows steady improvement (0.70 → 0.82)
- **Framework enrichment**: React patterns influenced design (useReducer, React.memo mentioned in contexts)

#### Step 2: Refining State Management

*Follow-up request* (manual operation for deeper exploration):

```json
{
  "operation": "l_execute",
  "l_thought": "Compare useReducer vs Zustand: evaluate trade-offs for WebSocket state with 100+ stock symbols",
  "l_cycle": 2,
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

*Response*:

```json
{
  "content": "Low-level execution step recorded.",
  "l_context": "...Comparison: useReducer requires more boilerplate but integrates naturally with React. Zustand offers simpler API and built-in middleware for persistence. For 100+ symbols, Zustand's selector-based subscriptions may reduce re-renders vs Context API. Recommendation: Zustand for this scale.",
  "l_cycle": 3,
  "diagnostics": {
    "plateau_count": 0,
    "confidence_window": [0.82]
  }
}
```

**Key Takeaways**:

- Framework detection automatically enriched reasoning with React-specific guidance
- `auto_reason` provided structured trace showing reasoning flow
- Diagnostics confirmed healthy convergence (no plateau)
- Manual operations (`l_execute`) allowed deeper exploration post-auto-reasoning

---

### Tutorial 2: Debugging Plateau Behavior

This tutorial shows how to diagnose and resolve plateau halting using diagnostics and parameter tuning.

**Scenario**: Auto reasoning halts prematurely via plateau trigger.

#### Step 1: Initial Run (Plateaus)

*Request*:

```json
{
  "operation": "auto_reason",
  "problem": "Optimize database queries for user analytics dashboard",
  "max_h_cycles": 4,
  "session_id": "661e8400-e29b-41d4-a716-446655440001"
}
```

*Response*:

```json
{
  "content": "Auto reasoning complete. Halted via plateau.",
  "trace": [
    {
      "operation": "h_plan",
      "h_cycle": 0,
      "l_cycle": 0,
      "note": "Initial planning"
    },
    {
      "operation": "evaluate",
      "h_cycle": 0,
      "l_cycle": 0,
      "note": "Assessment",
      "confidence": 0.65,
      "convergence": 0.60
    },
    {
      "operation": "h_update",
      "h_cycle": 1,
      "l_cycle": 0,
      "note": "Synthesis"
    },
    {
      "operation": "evaluate",
      "h_cycle": 1,
      "l_cycle": 0,
      "note": "Assessment",
      "confidence": 0.66,
      "convergence": 0.61
    },
    {
      "operation": "evaluate",
      "h_cycle": 2,
      "l_cycle": 0,
      "note": "Assessment",
      "confidence": 0.66,
      "convergence": 0.61
    }
  ],
  "halt_trigger": "plateau",
  "diagnostics": {
    "plateau_count": 2,
    "confidence_window": [0.65, 0.66, 0.66]
  }
}
```

**Diagnosis**:

- **`halt_trigger`**: `"plateau"` (stagnation detected)
- **`confidence_window`**: `[0.65, 0.66, 0.66]` (minimal improvement: 0.01)
- **`plateau_count`**: 2 (consecutive plateau confirmations)
- **Root cause**: Improvement (0.01) below `HRM_PLATEAU_DELTA` (default: 0.02)

**Solution**: Lower plateau delta to accept smaller improvements.

#### Step 2: Retry with Tuned Parameters

*Updated request*:

```json
{
  "operation": "auto_reason",
  "problem": "Optimize database queries for user analytics dashboard",
  "max_h_cycles": 4,
  "session_id": "661e8400-e29b-41d4-a716-446655440001",
  "reset_state": true
}
```

*Server configuration* (add to MCP config):

```json
{
  "env": {
    "HRM_PLATEAU_DELTA": "0.005",
    "HRM_PLATEAU_WINDOW": "5"
  }
}
```

*Response*:

```json
{
  "content": "Auto reasoning complete. Halted via confidence_convergence.",
  "trace": [
    { "...": "...7 total steps..." },
    {
      "operation": "evaluate",
      "h_cycle": 3,
      "l_cycle": 0,
      "note": "Final assessment",
      "confidence": 0.81,
      "convergence": 0.88
    }
  ],
  "halt_trigger": "confidence_convergence",
  "diagnostics": {
    "plateau_count": 0,
    "confidence_window": [0.65, 0.68, 0.73, 0.78, 0.81]
  }
}
```

**Result**:

- **`halt_trigger`**: `confidence_convergence` (success!)
- **`confidence_window`**: Shows gradual improvement accepted by lower delta
- **Longer window** (5) smoothed out early noise
- **Final confidence**: 0.81 (above 0.80 threshold)

**Key Takeaways**:

- Monitor `halt_trigger` to identify premature plateau halting
- Use `confidence_window` to see improvement trajectory
- Tune `HRM_PLATEAU_DELTA` for fine-grained vs coarse-grained progress
- Tune `HRM_PLATEAU_WINDOW` to smooth noise vs detect stagnation quickly
- Use `reset_state: true` to retry from clean slate with adjusted parameters

---

### Tutorial 3: Interpreting JSON Logs in Production

**Scenario**: Aggregate and analyze HRM logs in production environment.

**Server configuration**:

```json
{
  "env": {
    "HRM_LOG_FORMAT": "json",
    "HRM_DEBUG": "false"
  }
}
```

**Sample log stream**:

```json
{"timestamp":"2025-10-24T14:22:10.123Z","level":"info","message":"Auto reasoning started","context":{"session_id":"550e8400-e29b-41d4-a716-446655440000","problem":"Design API rate limiting"}}
{"timestamp":"2025-10-24T14:22:10.245Z","level":"info","message":"Framework detection complete","context":{"frameworks":["Express"],"confidence":{"Express":0.92}}}
{"timestamp":"2025-10-24T14:22:11.456Z","level":"info","message":"Evaluation complete","context":{"confidence":0.75,"convergence":0.70,"h_cycle":0}}
{"timestamp":"2025-10-24T14:22:12.789Z","level":"info","message":"Halt check evaluated","context":{"should_halt":false,"reason":"convergence below threshold"}}
{"timestamp":"2025-10-24T14:22:15.012Z","level":"info","message":"Evaluation complete","context":{"confidence":0.82,"convergence":0.88,"h_cycle":1}}
{"timestamp":"2025-10-24T14:22:15.234Z","level":"info","message":"Halt check evaluated","context":{"should_halt":true,"halt_trigger":"confidence_convergence"}}
```

**Parsing with jq** (filter for evaluations):

```bash
cat hrm.log | grep evaluation | jq '{time: .timestamp, confidence: .context.confidence, convergence: .context.convergence}'
```

**Output**:

```json
{"time":"2025-10-24T14:22:11.456Z","confidence":0.75,"convergence":0.70}
{"time":"2025-10-24T14:22:15.012Z","confidence":0.82,"convergence":0.88}
```

**Aggregation queries** (Splunk/CloudWatch):

```spl
# Average reasoning cycles to convergence
source="hrm.log" "halt_trigger"="confidence_convergence"
| stats avg(context.h_cycle) as avg_cycles

# Plateau rate (percentage of sessions halting via plateau)
source="hrm.log" "halt_trigger"
| stats count by context.halt_trigger
| eval plateau_rate=round((plateau/total)*100, 2)
```
```

**Aggregation queries** (Splunk/CloudWatch):

```
# Average reasoning cycles to convergence
source="hrm.log" "halt_trigger"="confidence_convergence"
| stats avg(context.h_cycle) as avg_cycles

# Plateau rate (percentage of sessions halting via plateau)
source="hrm.log" "halt_trigger"
| stats count by context.halt_trigger
| eval plateau_rate=round((plateau/total)*100, 2)

# Framework detection success rate
source="hrm.log" "Framework detection complete"
| stats count by context.frameworks
```

**Key Takeaways**:

- JSON logs enable programmatic analysis and alerting
- Structured `context` field contains rich debugging information
- ISO 8601 timestamps simplify time-series analysis
- Use debug mode temporarily to diagnose specific sessions

---

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

## 📊 Logging & Observability

### Log Formats

HRM supports two log output formats controlled by `HRM_LOG_FORMAT` environment variable.

#### Text Format (Default)

Human-readable colored output to stderr:

```text
[HRM] INFO: High-level plan recorded
[HRM] WARN: Convergence below threshold
[HRM] ERROR: Invalid session ID format
```

Colors:

- `INFO`: Cyan
- `WARN`: Yellow
- `ERROR`: Red
- `DEBUG`: Magenta (only with `HRM_DEBUG=true`)

#### JSON Format

Structured single-line JSON for log aggregation and parsing:

```json
{"timestamp":"2025-10-24T10:30:45.123Z","level":"info","message":"High-level plan recorded","context":{"session_id":"550e8400-e29b-41d4-a716-446655440000","operation":"h_plan"}}
{"timestamp":"2025-10-24T10:30:46.456Z","level":"warn","message":"Convergence below threshold","context":{"convergence":0.65,"threshold":0.85}}
```

**Fields**:

- `timestamp`: ISO 8601 format (UTC)
- `level`: `"info"` | `"warn"` | `"error"` | `"debug"`
- `message`: Log message text
- `context`: Optional structured data (objects, arrays, etc.)

**Circular reference handling**: If `context` contains circular references, JSON serialization falls back to `String(context)` and adds `"serializationError": true`.

**Enable JSON logging**:

```json
{
  "mcpServers": {
    "hierarchicalreasoning": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": { "HRM_LOG_FORMAT": "json" }
    }
  }
}
```

**Use cases**:

- **Text format**: Local development, debugging, human inspection
- **JSON format**: Production, log aggregation (Datadog, Splunk, CloudWatch), automated parsing

### Response Diagnostics

Every HRM response includes a `diagnostics` object for observability:

```json
{
  "diagnostics": {
    "plateau_count": 2,
    "confidence_window": [0.78, 0.79, 0.79]
  }
}
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `plateau_count` | number | Consecutive evaluations where confidence improvement < delta. Increments when stagnation detected, resets on progress. |
| `confidence_window` | number[] | Rolling window of recent confidence scores. Length matches `HRM_PLATEAU_WINDOW` (default: 3). Used for plateau detection. |

**Interpreting diagnostics**:

- **`plateau_count` increasing**: Reasoning is stagnating. Consider:
  - Lowering `HRM_PLATEAU_DELTA` (e.g., 0.01 → 0.005) to allow smaller improvements
  - Increasing `HRM_PLATEAU_WINDOW` (e.g., 3 → 5) to smooth out noise
  - Adding more context to `problem` statement

- **`confidence_window` flat**: Scores not improving. Possible causes:
  - Problem too vague or underspecified
  - Maximum reasoning depth reached for current approach
  - Framework detection not providing relevant guidance

- **`confidence_window` rising**: Healthy progress. Continue reasoning.

**Example tuning workflow**:

1. Run `auto_reason` with default settings
2. Check `halt_trigger` in response:
   - If `"plateau"` and reasoning seems incomplete → increase `HRM_PLATEAU_WINDOW` or decrease `HRM_PLATEAU_DELTA`
   - If `"max_steps"` → increase `max_h_cycles`
   - If `"confidence_convergence"` → success!
3. Re-run with adjusted parameters

### Plateau Tuning Guide

Plateau detection prevents infinite loops when reasoning stagnates. Tune these parameters based on your use case:

**HRM_PLATEAU_WINDOW** (default: 3, range: 2–20)

- **Lower values (2–3)**: Faster plateau detection, more aggressive halting
  - Use for: Quick prototyping, simple problems, noisy environments
  - Risk: May halt prematurely on legitimate slow progress

- **Higher values (5–10)**: Smoother detection, tolerates temporary stagnation
  - Use for: Complex problems, gradual convergence, production stability
  - Risk: Slower to detect genuine plateaus

**HRM_PLATEAU_DELTA** (default: 0.02, range: 0.001–0.1)

- **Lower values (0.001–0.01)**: Accept smaller improvements, continue reasoning longer
  - Use for: Fine-grained optimization, precision-critical tasks
  - Risk: May run many extra cycles for marginal gains

- **Higher values (0.03–0.1)**: Require substantial progress to avoid plateau
  - Use for: Coarse-grained planning, time-sensitive applications
  - Risk: May halt while meaningful (but small) progress is still possible

**Example configurations**:

```json
// Conservative (prefer thoroughness)
{
  "env": {
    "HRM_PLATEAU_WINDOW": "5",
    "HRM_PLATEAU_DELTA": "0.01"
  }
}

// Aggressive (prefer speed)
{
  "env": {
    "HRM_PLATEAU_WINDOW": "2",
    "HRM_PLATEAU_DELTA": "0.05"
  }
}

// Balanced (default)
{
  "env": {
    "HRM_PLATEAU_WINDOW": "3",
    "HRM_PLATEAU_DELTA": "0.02"
  }
}
```

**Monitoring plateau behavior**:

- Track `plateau_count` across multiple requests
- If frequently halting via `"plateau"` trigger → tune window/delta
- If never halting via `"plateau"` → parameters may be too lenient

### Debug Mode

Enable verbose logging with `HRM_DEBUG=true`:

```json
{
  "env": {
    "HRM_DEBUG": "true",
    "HRM_LOG_FORMAT": "json"
  }
}
```

**Debug logs include**:

- Framework detection results (confidence scores, matched indicators)
- Session lifecycle events (creation, eviction, TTL)
- Metrics calculation details (coverage, depth, diversity)
- Operation entry/exit with full state

**Performance impact**: Minimal (<5% overhead). Safe for production debugging.

---

### Runtime Environment Variables

Implemented:

| Variable | Effect |
|----------|--------|
| HRM_LOG_FORMAT | Log output format: `"json"` or `"text"` (default: `"text"`). JSON format for production log aggregation, text for local development. |
| HRM_DEBUG | Enable verbose debug logging when `"true"`. Shows framework detection, metrics calculation, session lifecycle. |
| HRM_CONVERGENCE_THRESHOLD / HRM_CONFIDENCE_THRESHOLD | Default convergence threshold if request omits `convergence_threshold` (0.5–0.99, default: 0.85). |
| HRM_SESSION_TTL_MS | Session eviction window in milliseconds (default: 3600000 = 1 hour). |
| HRM_PLATEAU_WINDOW | Sliding window length for plateau detection (2–20, default: 3). |
| HRM_PLATEAU_DELTA | Minimum confidence improvement to avoid plateau (0.001–0.1, default: 0.02). |
| HRM_INCLUDE_TEXT_TRACE | When `true`, append human‑readable auto reasoning trace to response `content` field (default: `false`). |

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
