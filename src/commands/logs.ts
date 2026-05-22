import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printLogs } from "../output";

const VALID_DAYS = new Set(["today", "7", "30"]);

export function registerLogsCommand(program: Command) {
	program
		.command("logs")
		.description("Fetch request logs for the current API key")
		.option("--days <days>", "today, 7, or 30", "7")
		.option("--endpoint <endpoint>")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			if (!VALID_DAYS.has(String(options.days))) {
				throw new CliError("`--days` must be one of: today, 7, 30.");
			}
			const result = await request<{
				endpoints: string[];
				logs: Record<string, unknown>[];
			}>({
				method: "GET",
				path: "/v1/logs",
				params: { days: String(options.days), endpoint: options.endpoint },
			});
			printLogs(result, Boolean(options.json));
		});
}
