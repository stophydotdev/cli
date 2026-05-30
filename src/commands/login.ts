import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import type { Command } from "commander";
import packageJson from "../../package.json";
import { startBrowserLogin } from "../browser-login";
import { green } from "../color";
import {
	getBrowserLoginUrl,
	loadConfig,
	resolveRuntimeConfig,
	saveConfig,
	setStoredApiKey,
	validateApiKey,
} from "../config";

type LoginMode = "api-key" | "browser";

async function prompt(question: string) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return (await rl.question(question)).trim();
	} finally {
		rl.close();
	}
}

async function promptForLoginMode(): Promise<LoginMode> {
	console.log(`stophy cli v${packageJson.version}`);
	console.log("YouTube data for AI agents");
	console.log("");
	console.log(
		"Welcome! To get started, authenticate with your Stophy account.",
	);
	console.log("");
	console.log("  1. Login with browser (recommended)");
	console.log("  2. Enter API key manually");
	console.log("");
	console.log("Tip: You can also set STOPHY_API_KEY environment variable");
	console.log("");

	for (;;) {
		const choice = await prompt("Enter choice [1/2]: ");
		if (choice === "1") {
			return "browser";
		}
		if (choice === "2") {
			return "api-key";
		}
		console.log(green("Enter 1 or 2."));
	}
}

async function promptForApiKey() {
	const value = await prompt("Paste your Stophy API key: ");
	return validateApiKey(value);
}

function getBrowserCommand(url: string) {
	if (process.platform === "darwin") {
		return ["open", url];
	}
	if (process.platform === "win32") {
		return ["cmd", "/c", "start", "", url];
	}
	return ["xdg-open", url];
}

async function tryOpenBrowser(url: string) {
	const command = getBrowserCommand(url);

	return await new Promise<boolean>((resolve) => {
		const child = spawn(command[0] ?? "xdg-open", command.slice(1), {
			stdio: "ignore",
			detached: true,
		});
		child.on("error", () => resolve(false));
		child.unref();
		resolve(true);
	});
}

async function resolveLoginMode(options: {
	apiKey?: boolean | string;
	browser?: boolean;
}): Promise<LoginMode> {
	if (options.browser && options.apiKey) {
		throw new Error("Use either `--browser` or `--api-key`, not both.");
	}
	if (options.browser) {
		return "browser";
	}
	if (options.apiKey) {
		return "api-key";
	}
	return await promptForLoginMode();
}

async function handleBrowserLogin() {
	const { baseUrl, frontendUrl } = await resolveRuntimeConfig();
	const pending = await startBrowserLogin();
	const { port, state } = pending;
	const loginUrl = getBrowserLoginUrl(baseUrl, frontendUrl, port, state);

	console.log("Authorizing Stophy CLI");
	console.log("Opening browser for authentication...");
	const opened = await tryOpenBrowser(loginUrl);
	if (!opened) {
		console.error("Could not open your browser automatically.");
	}
	console.log(green(`If the browser doesn't open, visit: ${loginUrl}`));
	console.log("");
	console.log("Authorizing Stophy CLI in your browser...");
	console.log("Waiting for browser authentication...");

	const result = await pending.result;
	const current = await loadConfig();
	await saveConfig({
		...current,
		...(result.apiKey ? { apiKey: result.apiKey } : {}),
		baseUrl: result.baseUrl ?? baseUrl,
		frontendUrl,
		sessionCookie: result.sessionCookie,
		sessionExpiresAt: result.sessionExpiresAt,
	});

	const message = result.apiKey
		? "Stophy CLI authorized. Saved browser session and API key."
		: "Stophy CLI authorized. Saved browser session.";
	console.log(green(message));
}

async function handleApiKeyLogin(apiKeyOption?: boolean | string) {
	const apiKey =
		typeof apiKeyOption === "string"
			? validateApiKey(apiKeyOption)
			: await promptForApiKey();
	await setStoredApiKey(apiKey);
	console.log(green("Saved API key."));
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
					await handleBrowserLogin();
					return;
				}

				await handleApiKeyLogin(options.apiKey);
			},
		);
}
