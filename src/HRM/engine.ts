import { computeReasoningMetrics } from "./utils/metrics.js";
import { appendContext, contextToText } from "./utils/text.js";
import { log, logState } from "./utils/logging.js";
import { handleCycleProgression, suggestNextOperation } from "./utils/suggestions.js";
import { handleEvaluate, handleHaltCheck } from "./operations/evaluation.js";
import { handleHighLevelPlan, handleHighLevelUpdate } from "./operations/highLevel.js";
import { handleLowLevelExecution } from "./operations/lowLevel.js";
import { SessionManager } from "./state.js";
import {
  AutoReasoningTraceEntry,
  HaltTrigger,
  HRMParameters,
  HRMResponse,
  HRMResponseContent,
  HRMOperation,
  HierarchicalState,
} from "./types.js";
import {
  AUTO_REASONING_OPERATIONS,
  MAX_AUTO_REASONING_STEPS,
  PROBLEM_SUMMARY_TEMPLATE,
} from "./constants.js";
import { FrameworkReasoningManager } from "./frameworks/index.js";

const envSessionTtl = Number.parseInt(process.env.HRM_SESSION_TTL_MS ?? "", 10);

export class HierarchicalReasoningEngine {
  private sessions = new SessionManager(
    Number.isFinite(envSessionTtl) ? envSessionTtl : undefined,
  );
  private frameworkManager = new FrameworkReasoningManager();

  async handleRequest(params: HRMParameters): Promise<HRMResponse> {
    // Apply environment variable defaults if corresponding fields are absent in request.
    // These do not override explicit user-provided parameters.
    // Planned vars: HRM_CONFIDENCE_THRESHOLD, HRM_CONVERGENCE_THRESHOLD, HRM_MAX_AUTO_STEPS (last not yet wired into constant loop cap).
    if (params.convergence_threshold === undefined) {
      const envConv = process.env.HRM_CONVERGENCE_THRESHOLD || process.env.HRM_CONFIDENCE_THRESHOLD; // allow alias
      if (envConv) {
        const n = Number(envConv);
        if (Number.isFinite(n) && n >= 0.5 && n <= 0.99) {
          params.convergence_threshold = n;
        }
      }
    }

    let session = this.sessions.getOrCreate(params);
    if (params.reset_state) {
      log("info", "Session reset requested", { sessionId: session.sessionId });
      session = this.sessions.reset(session.sessionId, params);
    }

    try {
      await this.maybeEnrichWithFrameworks(session, params);

      if (params.operation === "auto_reason") {
        return await this.runAutoReasoning(params, session);
      }

      const { summary, haltTrigger } = this.performOperation(params.operation, params, session);
      this.sessions.updateState(session, params.operation, summary);
      this.refreshMetrics(session, params.operation);
      const suggestion = suggestNextOperation(session, params.operation);
      return this.buildResponse(session, params.operation, summary, suggestion, {
        haltTrigger,
      });
    } catch (error) {
      log("error", "Operation failed", error);
      return this.errorResponse(session, params.operation, error);
    }
  }

  private async runAutoReasoning(params: HRMParameters, session: HierarchicalState): Promise<HRMResponse> {
    const trace: AutoReasoningTraceEntry[] = [];
    let haltTrigger: HaltTrigger | undefined;
    let step = 0;
    session.autoMode = true;
    if (!session.problem && params.problem) {
      session.problem = params.problem;
    }
    if (!session.hContext.length) {
      session.hContext = appendContext(
        session.hContext,
        session.problem || params.problem || PROBLEM_SUMMARY_TEMPLATE,
      );
    }

    let lastOperation: HRMOperation = "h_plan";
    let iterations = 0;
    const pushTrace = (entry: Omit<AutoReasoningTraceEntry, "step">) => {
      trace.push({ step: ++step, ...entry });
    };
    while (iterations < MAX_AUTO_REASONING_STEPS) {
      iterations += 1;
      const nextOp: HRMOperation = AUTO_REASONING_OPERATIONS.includes(lastOperation)
        ? suggestNextOperation(session, lastOperation)
        : "h_plan";

      if (nextOp === "halt_check") {
        handleEvaluate(session, params);
        const haltResult = handleHaltCheck(session);
        pushTrace({
          operation: nextOp,
          hCycle: session.hCycle,
          lCycle: session.lCycle,
          note: haltResult.rationale,
          metrics: session.metrics,
        });
        if (haltResult.shouldHalt) {
          haltTrigger = haltResult.trigger ?? haltTrigger;
          break;
        }
        lastOperation = "evaluate";
        continue;
      }

      const { summary, haltTrigger: opHaltTrigger } = this.performOperation(nextOp, params, session);
      this.sessions.updateState(session, nextOp, summary);
      this.refreshMetrics(session, nextOp);
      pushTrace({
        operation: nextOp,
        hCycle: session.hCycle,
        lCycle: session.lCycle,
        note: summary,
        metrics: session.metrics,
      });
      if (opHaltTrigger) {
        haltTrigger = opHaltTrigger;
      }

      if (!session.metrics.shouldContinue && nextOp !== "evaluate") {
        handleEvaluate(session, params);
        const haltResult = handleHaltCheck(session);
        pushTrace({
          operation: "halt_check",
          hCycle: session.hCycle,
          lCycle: session.lCycle,
          note: haltResult.rationale,
          metrics: session.metrics,
        });
        if (haltResult.shouldHalt) {
          haltTrigger = haltResult.trigger ?? haltTrigger;
          break;
        }
      }

      lastOperation = nextOp;
    }

    session.autoMode = false;
    if (!haltTrigger && iterations >= MAX_AUTO_REASONING_STEPS) {
      haltTrigger = "max_steps";
    }
    const finalResponse = this.buildResponse(
      session,
      "auto_reason",
      JSON.stringify(trace, null, 2),
      suggestNextOperation(session, lastOperation),
      {
        trace,
        haltTrigger,
      },
    );
    return finalResponse;
  }

  private performOperation(
    operation: HRMOperation,
    params: HRMParameters,
    session: HierarchicalState,
  ): { summary: string; haltTrigger?: HaltTrigger } {
    let summary = "";
    let haltTrigger: HaltTrigger | undefined;
    switch (operation) {
      case "h_plan":
        summary = handleHighLevelPlan(session, params);
        break;
      case "l_execute":
        summary = handleLowLevelExecution(session, params);
        break;
      case "h_update":
        summary = handleHighLevelUpdate(session, params);
        break;
      case "evaluate":
        const metrics = handleEvaluate(session, params);
        summary = `Confidence ${metrics.confidenceScore.toFixed(2)}, convergence ${metrics.convergenceScore.toFixed(2)}`;
        break;
      case "halt_check":
        const haltResult = handleHaltCheck(session);
        summary = haltResult.rationale;
        haltTrigger = haltResult.trigger;
        break;
      case "auto_reason":
        summary = "Automatic reasoning executed";
        break;
      default:
        throw new Error(`Unsupported operation ${operation}`);
    }
    handleCycleProgression(session, operation);
    logState("Operation performed", { operation, sessionId: session.sessionId, summary });
    return { summary, haltTrigger };
  }

  private refreshMetrics(session: HierarchicalState, operation: HRMOperation) {
    if (operation === "evaluate" || operation === "halt_check") {
      return;
    }
    session.metrics = computeReasoningMetrics(session);
  }

  private buildResponse(
    session: HierarchicalState,
    operation: HRMOperation,
    summary: string,
    suggestedNext: HRMOperation,
    extras: {
      trace?: AutoReasoningTraceEntry[];
      haltTrigger?: HaltTrigger;
    } = {},
  ): HRMResponse {
    const content: HRMResponseContent[] = [
      {
        type: "text",
        text: summary,
      },
    ];

    if (extras.trace && extras.trace.length) {
      content.push({
        type: "text",
        text: `Auto reasoning trace:\n${extras.trace
          .map(
            (entry) =>
              `${entry.step}. ${entry.operation} | H:${entry.hCycle} L:${entry.lCycle} | confidence ${entry.metrics.confidenceScore.toFixed(2)} convergence ${entry.metrics.convergenceScore.toFixed(2)} | ${entry.note}`,
          )
          .join("\n")}`,
      });
    }

    if (session.frameworkNotes.length) {
      const recentNotes = session.frameworkNotes.slice(-4).join("\n");
      content.push({ type: "text", text: `Framework guidance:\n${recentNotes}` });
    }

    const response: HRMResponse = {
      content,
      current_state: {
        h_cycle: session.hCycle,
        l_cycle: session.lCycle,
        h_context: contextToText(session.hContext),
        l_context: contextToText(session.lContext),
        operation_performed: operation,
        convergence_status: session.metrics.shouldContinue ? "converging" : "converged",
      },
      reasoning_metrics: session.metrics,
      suggested_next_operation: suggestedNext,
      session_id: session.sessionId,
    };
    if (extras.trace && extras.trace.length) {
      response.trace = extras.trace;
    }
    if (extras.haltTrigger) {
      response.halt_trigger = extras.haltTrigger;
    }
    return response;
  }

  private errorResponse(session: HierarchicalState, operation: HRMOperation, error: unknown): HRMResponse {
    return {
      content: [
        {
          type: "text",
          text: `Operation ${operation} failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      current_state: {
        h_cycle: session.hCycle,
        l_cycle: session.lCycle,
        h_context: contextToText(session.hContext),
        l_context: contextToText(session.lContext),
        operation_performed: operation,
        convergence_status: "diverging",
      },
      reasoning_metrics: session.metrics,
      suggested_next_operation: "evaluate",
      session_id: session.sessionId,
      isError: true,
      error_message: error instanceof Error ? error.message : String(error),
    };
  }

  private async maybeEnrichWithFrameworks(session: HierarchicalState, params: HRMParameters) {
    const workspacePath = params.workspace_path ?? session.workspacePath;
    const problem = params.problem || session.problem;

    const needDetection = Boolean(
      workspacePath &&
        (!session.frameworkInsight || session.workspacePath !== workspacePath),
    );

    const mentionsReact = Boolean(problem && problem.toLowerCase().includes("react"));
    const alreadyAugmented = session.frameworkInsight && session.frameworkNotes.length > 0;

    if (!needDetection && (!mentionsReact || alreadyAugmented)) {
      return;
    }

    const response = await this.frameworkManager.generateReasoning({
      workspacePath,
      problem: problem ?? undefined,
    });

    if (workspacePath) {
      session.workspacePath = workspacePath;
    }

    if (response.insight) {
      session.frameworkInsight = response.insight;
      if (response.insight.reasoningHighlights.length) {
        session.hContext = appendContext(
          session.hContext,
          response.insight.reasoningHighlights.join(" | "),
        );
      }
    }

    if (response.specializedPatterns.length) {
      const summary = response.specializedPatterns
        .map((pattern) => `${pattern.name}: ${pattern.guidance}`)
        .join(" | ");
      session.hContext = appendContext(session.hContext, summary);
    }

    if (response.notes.length) {
      session.frameworkNotes.push(...response.notes);
      if (session.frameworkNotes.length > 20) {
        session.frameworkNotes = session.frameworkNotes.slice(-20);
      }
    }
  }
}
