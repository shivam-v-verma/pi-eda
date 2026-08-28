import { readFile } from "node:fs/promises";
import { describe, test, expect } from "vitest";
import {
  handleInit,
  handleAdvance,
  handleStatus,
  handleClear,
  formatWidgetText,
  reconstructFromBranch,
  isValidGraph,
  resolveGraphPath,
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

describe("resolveGraphPath", () => {
  test("uses the bundled graph when no custom path is supplied", () => {
    expect(
      resolveGraphPath(undefined, "/package/skills/exploring-data/workflow.graph.json"),
    ).toBe("/package/skills/exploring-data/workflow.graph.json");
  });

  test("preserves a supplied custom graph path", () => {
    expect(
      resolveGraphPath(
        "custom/workflow.graph.json",
        "/package/skills/exploring-data/workflow.graph.json",
      ),
    ).toBe("custom/workflow.graph.json");
  });
});

describe("exploring-data skill", () => {
  test("initializes the bundled graph without a cwd-relative path", async () => {
    const skill = await readFile(
      new URL("../../skills/exploring-data/SKILL.md", import.meta.url),
      "utf8",
    );

    expect(skill).toContain("Run `init` on `eda-workflow-tracker`");
    expect(skill).not.toContain(
      'graphPath: "skills/exploring-data/workflow.graph.json"',
    );
  });
});

describe("exploring-data workflow", () => {
  test("requires a report name before advancing from scope", async () => {
    const workflow = await readFile(
      new URL("../../skills/exploring-data/workflow.md", import.meta.url),
      "utf8",
    );

    expect(workflow).toMatch(
      /`advance` condition: the user has confirmed the scope of the analysis and has\s+given a report name\./,
    );
    expect(workflow).not.toContain(
      "or the user has already requested a specific question.",
    );
  });
});

describe("README", () => {
  test("documents the required dispatcher installation", async () => {
    const readme = await readFile(
      new URL("../../README.md", import.meta.url),
      "utf8",
    );

    expect(readme).toContain("pi install npm:pi-subagents");
  });

  test("recommends inline-image terminal support for plot review", async () => {
    const readme = await readFile(
      new URL("../../README.md", import.meta.url),
      "utf8",
    );

    expect(readme).toContain("inline-image support");
    expect(readme).toContain("`terminal.showImages`");
  });
});

describe("isValidGraph", () => {
  test("accepts a well-shaped graph", () => {
    expect(isValidGraph({ start: "A", edges: { A: ["B"] } })).toBe(true);
  });

  test("rejects a missing edges key", () => {
    expect(isValidGraph({ start: "A" })).toBe(false);
  });

  test("rejects a missing start key", () => {
    expect(isValidGraph({ edges: {} })).toBe(false);
  });

  test("rejects an array used as edges", () => {
    expect(isValidGraph({ start: "A", edges: [] })).toBe(false);
  });

  test("rejects an edge value that is not an array", () => {
    expect(isValidGraph({ start: "A", edges: { A: 42 } })).toBe(false);
  });

  test("rejects an edge target that is not a string", () => {
    expect(isValidGraph({ start: "A", edges: { A: [42] } })).toBe(false);
  });

  test("rejects a start node absent from the graph", () => {
    expect(isValidGraph({ start: "Z", edges: { A: ["B"] } })).toBe(false);
  });

  test("accepts a terminal start node named only as an edge target", () => {
    expect(isValidGraph({ start: "B", edges: { A: ["B"] } })).toBe(true);
  });

  test("rejects non-object input", () => {
    expect(isValidGraph(null)).toBe(false);
    expect(isValidGraph("A")).toBe(false);
    expect(isValidGraph([])).toBe(false);
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

  test("force to an unknown node still lists legal options in the error", () => {
    const result = handleAdvance(graph, "A", "not-a-real-node", true);
    expect(result.error).toContain("B");
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
  test("picks the last non-error eda-workflow-tracker result", () => {
    const entries: BranchEntry[] = [
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "eda-workflow-tracker",
          details: {
            action: "init",
            graphPath: "p.json",
            current: "A",
            next: ["B"],
          },
        },
      },
      { type: "message", message: { role: "user" } },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "eda-workflow-tracker",
          details: {
            action: "advance",
            graphPath: "p.json",
            current: "B",
            next: ["C", "D"],
          },
        },
      },
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "eda-workflow-tracker",
          details: {
            action: "advance",
            graphPath: "p.json",
            current: "B",
            next: ["C", "D"],
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
