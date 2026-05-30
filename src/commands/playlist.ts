import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerPlaylistCommand(program: Command) {
	program
		.command("playlist")
		.description("Get all videos in a playlist with full metadata")
		.requiredOption("--url <url>", "YouTube playlist URL")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy playlist --url "https://youtube.com/playlist?list=PLxxxxxx"
  $ stophy playlist --url "https://youtube.com/playlist?list=PLxxxxxx" --json | jq '.data.videos[].title'
`)
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
