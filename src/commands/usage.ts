import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printUsage } from "../output";

const VALID_DAYS = new Set(["today", "7", "30"]);

export function registerUsageCommand(program: Command) {
	program
		.command("usage")
		.description("Show API usage for your key")
		.option("--days <days>", "today, 7, or 30", "7")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			if (!VALID_DAYS.has(String(options.days))) {
				throw new CliError("`--days` must be one of: today, 7, 30.");
			}
			const result = await request<{ items: Record<string, unknown>[] }>({
				method: "GET",
				path: "/v1/usage",
				params: { days: String(options.days) },
			});
			printUsage(result, Boolean(options.json));
		});
}
