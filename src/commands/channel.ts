import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerChannelCommand(program: Command) {
	program
		.command("channel")
		.description("Browse a channel's videos, shorts, playlists, or about page")
		.requiredOption("--url <url>", "YouTube channel URL")
		.option("--tab <tab>")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/channel",
				body: {
					channelUrl: options.url,
					tab: options.tab,
					continuationToken: options.continuationToken,
				},
			});
			printJson(result.body);
		});
}
