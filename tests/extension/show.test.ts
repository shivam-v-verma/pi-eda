import { describe, test, expect } from "vitest";
import { resolveMediaType, resolveImagePath } from "../../extensions/lib/show-core.js";

describe("resolveMediaType", () => {
  test("resolves a known extension", () => {
    expect(resolveMediaType("/a/b.png")).toBe("image/png");
  });

  test("is case-insensitive", () => {
    expect(resolveMediaType("/a/b.PNG")).toBe("image/png");
  });

  test("returns undefined for an unsupported extension", () => {
    expect(resolveMediaType("/a/b.txt")).toBeUndefined();
  });

  test("returns undefined for a path with no extension", () => {
    expect(resolveMediaType("/a/figure")).toBeUndefined();
  });
});

describe("resolveImagePath", () => {
  test("resolves a plain relative path against cwd", () => {
    expect(resolveImagePath("fig.png", "/proj")).toBe("/proj/fig.png");
  });

  test("strips a leading @ before resolving", () => {
    expect(resolveImagePath("@fig.png", "/proj")).toBe("/proj/fig.png");
  });

  test("leaves an absolute path untouched", () => {
    expect(resolveImagePath("/abs/fig.png", "/proj")).toBe("/abs/fig.png");
  });

  test("strips @ from an absolute path too", () => {
    expect(resolveImagePath("@/abs/fig.png", "/proj")).toBe("/abs/fig.png");
  });
});
