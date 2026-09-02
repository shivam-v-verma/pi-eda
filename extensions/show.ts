/**
 * Show Extension - Render an image to the user without spending LLM tokens on it.
 *
 * `show` reads an image file and renders it in the TUI via the built-in
 * `Image` component. The LLM only ever sees a short confirmation string in
 * `content` (what gets sent back to the model) - the image bytes live in
 * `details`, which is TUI-only and never enters LLM context. If the model
 * later needs to actually look at the image, it uses the normal `read` tool.
 */

import { readFile, stat } from "node:fs/promises";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Image, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { resolveImagePath, resolveMediaType } from "./lib/show-core.js";

interface ShowDetails {
	path: string;
	base64: string;
	mediaType: string;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "show",
		label: "Show",
		description:
			"Display an image to the user in the terminal without loading its pixels into your own context. " +
			"Use read on the same path afterward if you need to analyze the image yourself.",
		promptSnippet:
			"Show an image to the user in the terminal (does not add the image to your context)",
		promptGuidelines: [
			"Use show to display an image the user asked to see; use read instead when you need to look at the image yourself.",
		],
		parameters: Type.Object({
			path: Type.String({
				description: "Path to the image file (png, jpg, gif, webp, bmp)",
			}),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const absolutePath = resolveImagePath(params.path, ctx.cwd);

			const mediaType = resolveMediaType(absolutePath);
			if (!mediaType) {
				return {
					content: [
						{ type: "text", text: `Not a supported image type: ${params.path}` },
					],
					isError: true,
				};
			}

			const fileStat = await stat(absolutePath).catch(() => null);
			if (!fileStat?.isFile()) {
				return {
					content: [{ type: "text", text: `File not found: ${params.path}` }],
					isError: true,
				};
			}

			if (ctx.mode !== "tui") {
				return {
					content: [
						{
							type: "text",
							text: `Cannot render images outside interactive TUI mode (${ctx.mode}).`,
						},
					],
					isError: true,
				};
			}

			const base64 = (await readFile(absolutePath)).toString("base64");

			return {
				content: [{ type: "text", text: `Displayed ${params.path} to the user.` }],
				details: { path: params.path, base64, mediaType } as ShowDetails,
			};
		},

		renderCall(args, theme, _context) {
			return new Text(
				theme.fg("toolTitle", theme.bold("show ")) + theme.fg("muted", args.path),
				0,
				0,
			);
		},

		renderResult(result, _options, theme, _context) {
			const details = result.details as ShowDetails | undefined;
			if (!details) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}
			return new Image(details.base64, details.mediaType, theme, {
				maxWidthCells: 80,
				maxHeightCells: 36,
			});
		},
	});
}
