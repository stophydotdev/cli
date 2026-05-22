import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerTrendingCommand(program: Command) {
	program
		.command("trending")
		.description("Fetch trending videos")
		.option("--category <category>")
		.option("--region <region>")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "GET",
				path: "/v1/trending",
				params: {
					category: options.category,
					region: options.region,
					continuationToken: options.continuationToken,
				},
			});
			printJson(result.body);
		});
}
