import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { printLogs } from "../output.js";
import type { LogsData, LogsOptions } from "../types/account.js";

const VALID_DAYS = new Set(["today", "7", "30"]);

export function registerLogsCommand(program: Command) {
	program
		.command("logs")
		.description("Show request logs for your key")
		.option("--days <days>", "today, 7, or 30", "7")
		.option("--endpoint <endpoint>", "Filter by endpoint (e.g. /v1/search)")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy logs
  $ stophy logs --days today
  $ stophy logs --days 30 --endpoint /v1/search
  $ stophy logs --json | jq '.data.logs[0]'
`,
		)
		.action(async (options: LogsOptions) => {
			if (!VALID_DAYS.has(String(options.days))) {
				throw new CliError("`--days` must be one of: today, 7, 30.");
			}
			const result = await request<LogsData>({
				method: "GET",
				path: "/v1/logs",
				params: { days: String(options.days), endpoint: options.endpoint },
			});
			printLogs(result, options);
		});
}
