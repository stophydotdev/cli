import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type {
	KidsSearchData,
	KidsSearchOptions,
	KidsVideoData,
	KidsVideoOptions,
} from "../types/kids.js";

export function registerKidsCommands(program: Command) {
	const kids = program
		.command("kids")
		.description("Search YouTube Kids or fetch Kids video metadata");

	kids
		.command("search")
		.description("Search YouTube Kids")
		.requiredOption("--q <query>", "Search query")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy kids search --q "science"
`,
		)
		.action(async (options: KidsSearchOptions) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const result = await withSpinner("Searching YouTube Kids…", () =>
				request<KidsSearchData>({
					method: "POST",
					path: "/v1/kids",
					body: {
						type: "search",
						q: options.q,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});

	kids
		.command("video")
		.description("Get YouTube Kids video metadata and related Kids videos")
		.requiredOption("--url <url>", "YouTube Kids, YouTube, or bare video ID")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: KidsVideoOptions) => {
			const result = await withSpinner("Fetching Kids video…", () =>
				request<KidsVideoData>({
					method: "POST",
					path: "/v1/kids",
					body: { type: "video", videoUrl: options.url },
				}),
			);
			handleOutput(result.body, options);
		});
}
