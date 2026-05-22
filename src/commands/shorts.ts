import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerShortsCommand(program: Command) {
	program
		.command("shorts")
		.description("Fetch the shorts feed")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "GET",
				path: "/v1/shorts",
				params: { continuationToken: options.continuationToken },
			});
			printJson(result.body);
		});
}
