/**
 * Workflow Tracker Extension
 *
 * A native pi tool for tracking progress through a named-state workflow
 * graph (branches + loop-backs), not a flat todo list. Purely descriptive:
 * nothing downstream enforces it, `advance` just validates the move is
 * legal and remembers where the agent said it is.
 *
 * State is stored in tool result details for proper branching support,
 * same restore-from-branch pattern as plan_tracker. Shows a one-line
 * status widget with the raw current node name -- transparency for the
 * user, not enforcement.
 *
 * Pure logic lives in lib/eda-workflow-tracker-core.ts for testability. Nested
 * one level deep (not top-level extensions/, not an index.ts subdir) so pi's
 * extension auto-discovery does not try to load it as a standalone extension.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import {
  type WorkflowGraph,
  type WorkflowTrackerDetails,
  type BranchEntry,
  type ActionResult,
  isValidGraph,
  handleInit,
  handleAdvance,
  handleStatus,
  handleClear,
  formatWidgetText,
  reconstructFromBranch,
} from "./lib/eda-workflow-tracker-core.js";

const WorkflowTrackerParams = Type.Object({
  action: Type.Union(
    [
      Type.Literal("init"),
      Type.Literal("advance"),
      Type.Literal("status"),
      Type.Literal("clear"),
    ],
    { description: "Action to perform" },
  ),
  graphPath: Type.Optional(
    Type.String({
      description:
        "Path to a workflow.graph.json ({ start, edges }) (for init)",
    }),
  ),
  to: Type.Optional(
    Type.String({
      description: "Node name to advance to (for advance)",
    }),
  ),
  force: Type.Optional(
    Type.Boolean({
      description:
        "Allow advancing to any valid node in the graph, not just ones adjacent to the current node (for advance)",
    }),
  ),
});

export type WorkflowTrackerInput = Static<typeof WorkflowTrackerParams>;

export default function (pi: ExtensionAPI) {
  let graphPath = "";
  let graph: WorkflowGraph | undefined;
  let current = "";

  const loadGraphFile = async (cwd: string, path: string): Promise<unknown> => {
    const raw = await readFile(resolve(cwd, path), "utf-8");
    return JSON.parse(raw);
  };

  const reconstructState = async (ctx: ExtensionContext) => {
    const state = reconstructFromBranch(
      ctx.sessionManager.getBranch() as BranchEntry[],
    );
    graphPath = state.graphPath;
    current = state.current;
    graph = undefined;
    if (!graphPath) return;
    try {
      const parsed = await loadGraphFile(ctx.cwd, graphPath);
      if (isValidGraph(parsed)) graph = parsed;
    } catch {
      // leave graph undefined -- advance/status report it as not loaded
    }
  };

  const updateWidget = (ctx: ExtensionContext) => {
    if (!ctx.hasUI) return;
    const text = formatWidgetText(current);
    if (text) {
      ctx.ui.setWidget("eda-workflow-tracker", (_tui, theme) => {
        return new Text(theme.fg("muted", text), 0, 0);
      });
    } else {
      ctx.ui.setWidget("eda-workflow-tracker", undefined);
    }
  };

  for (const event of [
    "session_start",
    "session_switch",
    "session_fork",
    "session_tree",
  ] as const) {
    pi.on(event, async (_event, ctx) => {
      await reconstructState(ctx);
      updateWidget(ctx);
    });
  }

  pi.registerTool({
    name: "eda-workflow-tracker",
    label: "Workflow Tracker",
    description:
      "Track the current state in a named-state workflow graph (branches/loop-backs, not a flat " +
      "todo list). Actions: init (load a workflow.graph.json and set current to its start), " +
      "advance (move to a node; must be adjacent to current unless force is set, in which case " +
      "any valid node in the graph is allowed), status (show current state), clear (reset).",
    parameters: WorkflowTrackerParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      let result: ActionResult;

      switch (params.action) {
        case "init": {
          if (!params.graphPath) {
            result = {
              graphPath,
              current,
              next: [],
              error: "graphPath required for init",
            };
            break;
          }
          try {
            const parsed = await loadGraphFile(ctx.cwd, params.graphPath);
            if (!isValidGraph(parsed)) {
              throw new Error("expected { start: string, edges: object }");
            }
            graph = parsed;
          } catch (err) {
            result = {
              graphPath,
              current,
              next: [],
              error: `failed to load graph at "${params.graphPath}": ${(err as Error).message}`,
            };
            break;
          }
          result = handleInit(graph, params.graphPath);
          graphPath = result.graphPath;
          current = result.current;
          updateWidget(ctx);
          break;
        }
        case "advance": {
          if (!graph) {
            result = {
              graphPath,
              current,
              next: [],
              error: "no graph loaded -- call init first",
            };
            break;
          }
          if (!params.to) {
            result = {
              graphPath,
              current,
              next: [],
              error: "to required for advance",
            };
            break;
          }
          result = handleAdvance(
            graph,
            current,
            params.to,
            params.force ?? false,
            graphPath,
          );
          current = result.current;
          updateWidget(ctx);
          break;
        }
        case "status": {
          result = handleStatus(graph, current, graphPath);
          break;
        }
        case "clear": {
          result = handleClear();
          graphPath = result.graphPath;
          current = result.current;
          graph = undefined;
          updateWidget(ctx);
          break;
        }
        default: {
          result = {
            graphPath,
            current,
            next: [],
            error: `unknown action: ${params.action as string}`,
          };
        }
      }

      const details: WorkflowTrackerDetails = {
        action: params.action,
        graphPath: result.graphPath,
        current: result.current,
        next: result.next,
        ...(result.error ? { error: result.error } : {}),
      };

      return {
        content: [
          {
            type: "text",
            text: result.error
              ? `Error: ${result.error}`
              : `current: "${result.current}"; next: ${JSON.stringify(result.next)}`,
          },
        ],
        details,
      };
    },

    renderCall(args, theme) {
      let text = theme.fg("toolTitle", theme.bold("eda-workflow-tracker "));
      text += theme.fg("muted", args.action);
      if (args.action === "advance" && args.to) {
        text += ` -> ${theme.fg("accent", args.to)}`;
        if (args.force) text += theme.fg("dim", " (force)");
      }
      return new Text(text, 0, 0);
    },

    renderResult(result, _options, theme) {
      const details = result.details as WorkflowTrackerDetails | undefined;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }
      if (details.error) {
        return new Text(theme.fg("error", `Error: ${details.error}`), 0, 0);
      }
      return new Text(
        theme.fg("success", "✓ ") + theme.fg("muted", details.current),
        0,
        0,
      );
    },
  });
}
