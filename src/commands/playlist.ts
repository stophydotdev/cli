import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerPlaylistCommand(program: Command) {
	program
		.command("playlist")
		.description("Fetch playlist details and videos")
		.requiredOption("--url <url>", "YouTube playlist URL")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/playlist",
				body: {
					playlistUrl: options.url,
					continuationToken: options.continuationToken,
				},
			});
			printJson(result.body);
		});
}
