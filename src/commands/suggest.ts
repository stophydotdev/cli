import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printJson } from "../output";

export function registerSuggestCommand(program: Command) {
	program
		.command("suggest")
		.description("Get YouTube search autocomplete suggestions")
		.requiredOption("--q <query>", "Partial search query")
		.option("--hl <lang>", "Language code (default: en)")
		.option("--gl <country>", "Country code (default: US)")
		.option("--json", "Print raw JSON")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy suggest --q "how to"
  $ stophy suggest --q "typescript" --hl en --gl US
  $ stophy suggest --q "recettes" --hl fr --gl FR
`,
		)
		.action(async (options) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const params = new URLSearchParams({ q: options.q });
			if (options.hl) params.set("hl", options.hl);
			if (options.gl) params.set("gl", options.gl);
			const result = await request<{ suggestions: string[] }>({
				method: "GET",
				path: `/v1/suggest?${params.toString()}`,
			});
			if (options.json) {
				printJson(result.body);
			} else {
				const suggestions = result.body.data?.suggestions ?? [];
				for (const s of suggestions) {
					console.log(s);
				}
			}
		});
}
