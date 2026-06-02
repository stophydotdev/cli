import type { Command } from "commander";
import packageJson from "../../package.json";
import { green } from "../color";
import { resolveRuntimeConfig, setStoredApiKey, validateApiKey } from "../config";
import {
	doBrowserLogin,
	prompt,
} from "../prompt-login";

const err = (msg: string) => process.stderr.write(`${msg}\n`);

type LoginMode = "api-key" | "browser";

async function promptForLoginMode(): Promise<LoginMode> {
	err(`  📺 @stophy/cli v${packageJson.version}`);
	err("  YouTube for AI Agents");
	err("");
	err("Welcome! To get started, authenticate with your Stophy account.");
	err("");
	err("  1. Login with browser (recommended)");
	err("  2. Enter API key manually");
	err("");
	err("Tip: You can also set STOPHY_API_KEY environment variable");
	err("");

	for (;;) {
		const choice = await prompt("Enter choice [1/2]: ");
		if (choice === "1") return "browser";
		if (choice === "2") return "api-key";
		err(green("Enter 1 or 2."));
	}
}

async function resolveLoginMode(options: {
	apiKey?: boolean | string;
	browser?: boolean;
}): Promise<LoginMode> {
	if (options.browser && options.apiKey) {
		throw new Error("Use either `--browser` or `--api-key`, not both.");
	}
	if (options.browser) return "browser";
	if (options.apiKey) return "api-key";
	return await promptForLoginMode();
}

async function handleApiKeyLogin(apiKeyOption?: boolean | string) {
	const apiKey =
		typeof apiKeyOption === "string"
			? validateApiKey(apiKeyOption)
			: validateApiKey(await prompt("Paste your Stophy API key: "));
	await setStoredApiKey(apiKey);
	err(green("Saved API key."));
}

export function registerLoginCommand(program: Command) {
	program
		.command("login")
		.description("Log in to your Stophy account")
		.option("--browser", "Open the Stophy login page in your browser")
		.option("--api-key [key]", "Store an API key directly")
		.action(
			async (options: { apiKey?: boolean | string; browser?: boolean }) => {
				const mode = await resolveLoginMode(options);
				if (mode === "browser") {
					await doBrowserLogin();
					return;
				}

				await handleApiKeyLogin(options.apiKey);
			},
		);
}
