import type { Command } from "commander";
import { request } from "../client.js";
import { handleOutput, writeOutput } from "../output.js";
import type { CreditsData } from "../types/account.js";
import type { OutputOptions } from "../types/api.js";

export function registerCreditsCommand(program: Command) {
	program
		.command("credits")
		.description("Show your remaining credit balance")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy credits
  $ stophy credits --json
`,
		)
		.action(async (options: OutputOptions) => {
			const result = await request<CreditsData>({
				method: "GET",
				path: "/v1/credits",
			});
			if (options.json) {
				handleOutput(result.body, options);
				return;
			}
			writeOutput(
				`Credits remaining: ${result.body.data?.credits}`,
				options.output,
				Boolean(options.output),
			);
		});
}
