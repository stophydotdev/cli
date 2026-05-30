import type { Command } from "commander";
import { request } from "../client";
import { printJson } from "../output";

export function registerCreditsCommand(program: Command) {
	program
		.command("credits")
		.description("Show your remaining credit balance")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy credits
  $ stophy credits --json
`)
		.action(async (options) => {
			const result = await request<{ credits: number }>({
				method: "GET",
				path: "/v1/credits",
			});
			if (options.json) {
				printJson(result.body);
			} else {
				console.log(`Credits remaining: ${result.body.data?.credits}`);
			}
		});
}
