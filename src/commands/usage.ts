import type { Command } from "commander";
import { formatBalance, usageDataSchema } from "../account.js";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput, writeOutput } from "../output.js";
import type { OutputOptions } from "../types/api.js";

export function registerUsageCommand(program: Command) {
	program
		.command("usage")
		.description("Show your balance and all-time usage")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy usage
  $ stophy usage --json
`,
		)
		.action(async (options: OutputOptions) => {
			const response = await request({
				method: "GET",
				path: "/v1/usage",
				accept: "application/json",
			});
			const parsed = usageDataSchema.safeParse(response.json);
			if (!parsed.success)
				throw new CliError("Server returned an unexpected response shape.");
			if (options.json || options.output) {
				handleOutput(parsed.data, options);
				return;
			}
			writeOutput(
				[
					`balance: ${formatBalance(parsed.data.balanceMicros)}`,
					`credits used (all time): ${parsed.data.creditsUsed}`,
					`requests (all time): ${parsed.data.requestCount}`,
				].join("\n"),
			);
		});
}
