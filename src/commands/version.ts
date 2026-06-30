import type { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };
import { resolveRuntimeConfig } from "../config.js";

export function registerVersionCommand(program: Command) {
	program
		.command("version")
		.description("Show the CLI version and authentication status")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const { apiKey, apiKeySource, sessionCookie } =
				await resolveRuntimeConfig();
			const authenticated = Boolean(apiKey || sessionCookie);
			const source = apiKey ? apiKeySource : sessionCookie ? "session" : "none";

			if (options.json) {
				console.log(
					JSON.stringify(
						{ version: packageJson.version, authenticated, source },
						null,
						2,
					),
				);
				return;
			}

			console.log(`version: ${packageJson.version}`);
			console.log(`authenticated: ${authenticated}`);
			if (authenticated) {
				console.log(`source: ${source}`);
			}
		});
}
