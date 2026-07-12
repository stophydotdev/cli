import type { Command } from "commander";
import { request } from "../client.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type { ChannelData, ChannelOptions } from "../types/channel.js";

export function registerChannelCommand(program: Command) {
	program
		.command("channel")
		.description(
			"Inspect a channel's videos, Shorts, live streams, community posts, courses, playlists, or about page",
		)
		.requiredOption("--url <url>", "YouTube channel URL")
		.option("--query <query>", "Search within the channel")
		.option(
			"--tab <tab>",
			"video, short, live, playlist, post, community, course, or about (default: video)",
		)
		.option(
			"--sortBy <sortBy>",
			"latest, popular, or oldest (only applies with --tab video)",
		)
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy channel --url "https://www.youtube.com/@t3dotgg"
  $ stophy channel --url "https://www.youtube.com/@t3dotgg" --tab video --sortBy popular
  $ stophy channel --url "https://www.youtube.com/@t3dotgg" --tab playlist
  $ stophy channel --url "https://www.youtube.com/@t3dotgg" --tab post
	  $ stophy channel --url "https://www.youtube.com/@freecodecamp" --tab community
	  $ stophy channel --url "https://www.youtube.com/@freecodecamp" --tab course
  $ stophy channel --url "https://www.youtube.com/@t3dotgg" --query react
  $ stophy channel --url "https://www.youtube.com/@t3dotgg" --tab about --json
`,
		)
		.action(async (options: ChannelOptions) => {
			const result = await withSpinner("Fetching channel…", () =>
				request<ChannelData>({
					method: "POST",
					path: "/v1/channel",
					body: {
						channelUrl: options.url,
						query: options.query,
						tab: options.tab,
						sortBy: options.sortBy,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});
}
