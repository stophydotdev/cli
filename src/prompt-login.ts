import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import packageJson from "../package.json";
import { green } from "./color";
import {
	getBrowserLoginUrl,
	loadConfig,
	resolveRuntimeConfig,
	saveConfig,
	setStoredApiKey,
	validateApiKey,
} from "./config";
import { startBrowserLogin } from "./browser-login";

const err = (msg: string) => process.stderr.write(`${msg}\n`);

export function prompt(question: string): Promise<string> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

function getBrowserCommand(url: string) {
	if (process.platform === "darwin") return ["open", url];
	if (process.platform === "win32") return ["cmd", "/c", "start", "", url];
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

export async function doBrowserLogin() {
	const { baseUrl, frontendUrl } = await resolveRuntimeConfig();
	const pending = await startBrowserLogin(baseUrl);
	const { sessionId, codeChallenge } = pending;
	const loginUrl = getBrowserLoginUrl(frontendUrl, sessionId, codeChallenge);

	err("");
	err(green(loginUrl));
	err("");
	await prompt("Press Enter to open your browser...");
	const opened = await tryOpenBrowser(loginUrl);
	if (!opened) {
		err("Could not open browser automatically. Please visit the URL above.");
	}
	err("Waiting for authorization in your browser...");

	const result = await pending.result;
	const current = await loadConfig();
	await saveConfig({
		...current,
		apiKey: result.apiKey,
		baseUrl,
		frontendUrl,
	});
	err(green("Stophy CLI authorized. Saved API key."));
}

async function doApiKeyLogin() {
	const value = await prompt("Paste your Stophy API key: ");
	const apiKey = validateApiKey(value);
	await setStoredApiKey(apiKey);
	err(green("Saved API key."));
}

export async function promptLogin() {
	err(`  📺 @stophy/cli v${packageJson.version}`);
	err("  The API to search, extract, and analyze YouTube at scale");
	err("");
	err("Welcome! To get started, authenticate with your Stophy account.");
	err("");
	err("  1. Login with browser (recommended)");
	err("  2. Enter API key manually");
	err("");
	err("Tip: You can also set STOPHY_API_KEY environment variable");
	err("");

	let mode: "browser" | "api-key" | null = null;
	while (!mode) {
		const choice = await prompt("Enter choice [1/2]: ");
		if (choice === "1") mode = "browser";
		else if (choice === "2") mode = "api-key";
		else err(green("Enter 1 or 2."));
	}

	if (mode === "browser") {
		await doBrowserLogin();
	} else {
		await doApiKeyLogin();
	}

	return resolveRuntimeConfig();
}
