/**
 * Pure logic for the `show` extension, split out for unit testing without
 * needing a live ExtensionAPI/TUI (same pattern as eda-workflow-tracker-core.ts).
 */

import { extname, resolve } from "node:path";

const MEDIA_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

export function resolveMediaType(path: string): string | undefined {
  return MEDIA_TYPES[extname(path).toLowerCase()];
}

export function resolveImagePath(rawPath: string, cwd: string): string {
  const path = rawPath.startsWith("@") ? rawPath.slice(1) : rawPath;
  return resolve(cwd, path);
}
