import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printJson } from "../output";

export function registerSearchCommand(program: Command) {
	program
		.command("search")
		.description("Search YouTube videos, channels, and playlists")
		.requiredOption("--q <query>", "Search query")
		.option("--type <type>")
		.option("--sortBy <sortBy>")
		.option("--uploadDate <uploadDate>")
		.option("--duration <duration>")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
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
