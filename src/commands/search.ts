import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printJson } from "../output";

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
		.addHelpText(
			"after",
			`
Examples:
  $ stophy search --q "machine learning"
  $ stophy search --q "cooking" --type video --sortBy viewCount
  $ stophy search --q "news" --uploadDate today --duration short
  $ stophy search --q "nodejs" --json | jq '.data.results[0]'
`,
		)
		.action(async (options) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const result = await request<Record<string, unknown>>({
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
			});
			printJson(result.body);
		});
}
