import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type { SearchData, SearchOptions } from "../types/search.js";

export function registerSearchCommand(program: Command) {
	program
		.command("search")
		.description("Search YouTube videos, channels, and playlists")
		.requiredOption("--q <query>", "Search query")
		.option("--type <type>", "video, channel, or playlist")
		.option("--sortBy <sortBy>", "relevance, uploadDate, viewCount, or rating")
		.option("--uploadDate <uploadDate>", "hour, today, week, month, or year")
		.option("--duration <duration>", "short, medium, or long")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy search --q "machine learning"
  $ stophy search --q "cooking" --type video --sortBy viewCount
  $ stophy search --q "news" --uploadDate today --duration short
  $ stophy search --q "nodejs" --json | jq '.data.items[0]'
`,
		)
		.action(async (options: SearchOptions) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const result = await withSpinner(`Searching for "${options.q}"…`, () =>
				request<SearchData>({
					method: "POST",
					path: "/v1/search",
					body: {
						q: options.q,
						type: options.type,
						sortBy: options.sortBy,
						uploadDate: options.uploadDate,
						duration: options.duration,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});
}
