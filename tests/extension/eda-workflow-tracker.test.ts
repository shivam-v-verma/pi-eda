import { describe, test, expect } from "vitest";
import {
  handleInit,
  handleAdvance,
  handleStatus,
  handleClear,
  formatWidgetText,
  reconstructFromBranch,
  type WorkflowGraph,
  type BranchEntry,
} from "../../extensions/lib/eda-workflow-tracker-core.js";

const graph: WorkflowGraph = {
  start: "A",
  edges: {
    A: ["B"],
    B: ["C", "D"],
    C: ["E"],
    D: ["E"],
  },
};

describe("handleInit", () => {
  test("sets current to graph.start", () => {
    const result = handleInit(graph, "some/path.json");
    expect(result.error).toBeUndefined();
    expect(result.current).toBe("A");
    expect(result.graphPath).toBe("some/path.json");
  });

  test("next lists edges out of the start node", () => {
    const result = handleInit(graph, "some/path.json");
    expect(result.next).toEqual(["B"]);
  });
});

describe("handleAdvance", () => {
  test("adjacent transition succeeds", () => {
    const result = handleAdvance(graph, "A", "B", false);
    expect(result.error).toBeUndefined();
    expect(result.current).toBe("B");
  });

  test("next lists edges out of the new current node", () => {
    const result = handleAdvance(graph, "A", "B", false);
    expect(result.next).toEqual(["C", "D"]);
  });

  test("next is empty on a terminal node", () => {
    const result = handleAdvance(graph, "C", "E", false);
    expect(result.next).toEqual([]);
  });

  test("non-adjacent transition without force fails and lists legal options", () => {
    const result = handleAdvance(graph, "A", "E", false);
    expect(result.error).toContain("E");
    expect(result.error).toContain("B");
    expect(result.current).toBe("A");
  });

  test("failed transition leaves next as the unchanged current node's edges", () => {
    const result = handleAdvance(graph, "A", "E", false);
    expect(result.next).toEqual(["B"]);
  });

  test("non-adjacent transition with force and a valid node succeeds", () => {
    const result = handleAdvance(graph, "A", "E", true);
    expect(result.error).toBeUndefined();
    expect(result.current).toBe("E");
  });

  test("advance is case-insensitive and returns the canonical casing", () => {
    const result = handleAdvance(graph, "A", "b", false);
    expect(result.error).toBeUndefined();
    expect(result.current).toBe("B");
  });

  test("force does not bypass the valid-node check", () => {
    const result = handleAdvance(graph, "A", "not-a-real-node", true);
    expect(result.error).toContain("not-a-real-node");
    expect(result.current).toBe("A");
  });
});

describe("handleStatus", () => {
  test("returns current unchanged", () => {
    expect(handleStatus(graph, "B").current).toBe("B");
  });

  test("next lists edges out of current", () => {
    expect(handleStatus(graph, "B").next).toEqual(["C", "D"]);
  });

  test("next is empty when no graph is loaded", () => {
    expect(handleStatus(undefined, "").next).toEqual([]);
  });
});

describe("handleClear", () => {
  test("resets current to empty", () => {
    const result = handleClear();
    expect(result.current).toBe("");
  });

  test("next is empty", () => {
    expect(handleClear().next).toEqual([]);
  });
});

describe("formatWidgetText", () => {
  test("empty current means no widget", () => {
    expect(formatWidgetText("")).toBeUndefined();
  });

  test("non-empty current renders verbatim with a prefix", () => {
    expect(formatWidgetText("Build script/plot")).toBe(
      "EDA workflow: Build script/plot",
    );
  });
});

describe("reconstructFromBranch", () => {
  test("picks the last non-error workflow_tracker result", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "workflow_tracker",
          details: { action: "init", graphPath: "p.json", current: "A" },
        },
      },
      { type: "message", message: { role: "user" } },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "workflow_tracker",
          details: { action: "advance", graphPath: "p.json", current: "B" },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "workflow_tracker",
          details: {
            action: "advance",
            graphPath: "p.json",
            current: "B",
            error: "nope",
          },
        },
      },
    ];
    const result = reconstructFromBranch(entries);
    expect(result.current).toBe("B");
    expect(result.graphPath).toBe("p.json");
  });

  test("empty branch reconstructs to no state", () => {
    expect(reconstructFromBranch([]).current).toBe("");
  });
});
