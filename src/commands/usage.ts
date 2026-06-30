import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { printUsage } from "../output.js";
import type { UsageData, UsageOptions } from "../types/account.js";

const VALID_DAYS = new Set(["today", "7", "30"]);

export function registerUsageCommand(program: Command) {
	program
		.command("usage")
		.description("Show API usage for your key")
		.option("--days <days>", "today, 7, or 30", "7")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy usage
  $ stophy usage --days today
  $ stophy usage --days 30 --json
`,
		)
		.action(async (options: UsageOptions) => {
			if (!VALID_DAYS.has(String(options.days))) {
				throw new CliError("`--days` must be one of: today, 7, 30.");
			}
			const result = await request<UsageData>({
				method: "GET",
				path: "/v1/usage",
				params: { days: String(options.days) },
			});
			printUsage(result, options);
		});
}
