import type { Command } from "commander";
import { request } from "../client.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type { PlaylistData, PlaylistOptions } from "../types/playlist.js";

export function registerPlaylistCommand(program: Command) {
	program
		.command("playlist")
		.description("Get playlist videos and metadata")
		.requiredOption("--url <url>", "YouTube playlist URL")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy playlist --url "https://youtube.com/playlist?list=PLxxxxxx"
  $ stophy playlist --url "https://youtube.com/playlist?list=PLxxxxxx" --json | jq '.data.items[].title'
`,
		)
		.action(async (options: PlaylistOptions) => {
			const result = await withSpinner("Fetching playlist…", () =>
				request<PlaylistData>({
					method: "POST",
					path: "/v1/playlist",
					body: {
						playlistUrl: options.url,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});
}
