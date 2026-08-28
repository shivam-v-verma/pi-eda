/**
 * Workflow Tracker Core Logic
 *
 * Pure functions for a graph-shaped (not list-shaped) progress tracker:
 * "current" is a node name in a caller-supplied edges map, advanced by
 * naming the next node rather than by index. No pi dependencies.
 */

export interface WorkflowGraph {
  start: string;
  edges: Record<string, string[]>;
}

/** True if `value` has a known start node and string-array edges. */
export function isValidGraph(value: unknown): value is WorkflowGraph {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.start !== "string" ||
    typeof candidate.edges !== "object" ||
    candidate.edges === null ||
    Array.isArray(candidate.edges)
  ) {
    return false;
  }

  const edges = candidate.edges as Record<string, unknown>;
  if (
    !Object.values(edges).every(
      (targets) =>
        Array.isArray(targets) &&
        targets.every((target) => typeof target === "string"),
    )
  ) {
    return false;
  }

  return allNodes(edges as Record<string, string[]>).has(candidate.start);
}

export function resolveGraphPath(
  graphPath: string | undefined,
  bundledGraphPath: string,
): string {
  return graphPath ?? bundledGraphPath;
}

export interface WorkflowTrackerDetails {
  action: "init" | "advance" | "status" | "clear";
  graphPath: string;
  current: string;
  next: string[];
  error?: string;
}

export interface ActionResult {
  graphPath: string;
  current: string;
  next: string[];
  error?: string;
}

/** Nodes reachable in one step from `node`, or [] if none/no graph loaded. */
function nextFrom(graph: WorkflowGraph | undefined, node: string): string[] {
  return graph?.edges[node] ?? [];
}

function allNodes(edges: Record<string, string[]>): Set<string> {
  const nodes = new Set<string>(Object.keys(edges));
  for (const targets of Object.values(edges)) {
    for (const target of targets) nodes.add(target);
  }
  return nodes;
}

/** Case-insensitive lookup: returns the canonically-cased node name, or undefined if none matches. */
function canonicalize(
  candidates: Iterable<string>,
  name: string,
): string | undefined {
  const lower = name.toLowerCase();
  for (const candidate of candidates) {
    if (candidate.toLowerCase() === lower) return candidate;
  }
  return undefined;
}

export function handleInit(
  graph: WorkflowGraph,
  graphPath: string,
): ActionResult {
  return {
    graphPath,
    current: graph.start,
    next: nextFrom(graph, graph.start),
  };
}

export function handleAdvance(
  graph: WorkflowGraph,
  current: string,
  to: string,
  force: boolean,
  graphPath = "",
): ActionResult {
  const legalFromCurrent = graph.edges[current] ?? [];

  if (!force) {
    const canonical = canonicalize(legalFromCurrent, to);
    if (!canonical) {
      return {
        graphPath,
        current,
        next: legalFromCurrent,
        error: `"${to}" is not reachable from "${current}"; legal: ${JSON.stringify(legalFromCurrent)}`,
      };
    }
    return { graphPath, current: canonical, next: nextFrom(graph, canonical) };
  }

  const canonical = canonicalize(allNodes(graph.edges), to);
  if (!canonical) {
    return {
      graphPath,
      current,
      next: legalFromCurrent,
      error: `"${to}" is not a known node in this graph; legal: ${JSON.stringify(legalFromCurrent)}`,
    };
  }
  return { graphPath, current: canonical, next: nextFrom(graph, canonical) };
}

export function handleStatus(
  graph: WorkflowGraph | undefined,
  current: string,
  graphPath = "",
): ActionResult {
  return { graphPath, current, next: nextFrom(graph, current) };
}

export function handleClear(): ActionResult {
  return { graphPath: "", current: "", next: [] };
}

export function formatWidgetText(current: string): string | undefined {
  return current ? `EDA workflow: ${current}` : undefined;
}

// --- State Reconstruction ---

export interface BranchEntry {
  type: string;
  message?: {
    role: string;
    toolName?: string;
    details?: WorkflowTrackerDetails;
  };
}

export function reconstructFromBranch(entries: BranchEntry[]): ActionResult {
  let state: ActionResult = { graphPath: "", current: "", next: [] };
  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const msg = entry.message;
    if (
      !msg ||
      msg.role !== "toolResult" ||
      msg.toolName !== "eda-workflow-tracker"
    )
      continue;
    const details = msg.details;
    if (details && !details.error) {
      state = {
        graphPath: details.graphPath,
        current: details.current,
        next: details.next,
      };
    }
  }
  return state;
}
