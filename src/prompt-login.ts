import open from "open";
import prompts from "prompts";
import packageJson from "../package.json" with { type: "json" };
import { startBrowserLogin } from "./browser-login.js";
import { green } from "./color.js";
import {
	getBrowserLoginUrl,
	loadConfig,
	resolveRuntimeConfig,
	saveConfig,
	setStoredApiKey,
	validateApiKey,
} from "./config.js";

const err = (msg: string) => process.stderr.write(`${msg}\n`);

export async function prompt(question: string): Promise<string> {
	const { value } = await prompts({
		type: "text",
		name: "value",
		message: question,
	});
	return typeof value === "string" ? value.trim() : "";
}

async function tryOpenBrowser(url: string): Promise<boolean> {
	try {
		await open(url);
		return true;
	} catch {
		return false;
	}
}

export async function doBrowserLogin(options?: { promptBeforeOpen?: boolean }) {
	const { baseUrl, frontendUrl } = await resolveRuntimeConfig();
	const pending = await startBrowserLogin(baseUrl);
	const { sessionId, codeChallenge } = pending;
	const loginUrl = getBrowserLoginUrl(frontendUrl, sessionId, codeChallenge);

	err("");
	err(green(loginUrl));
	err("");
	if (options?.promptBeforeOpen !== false) {
		await prompt("Press Enter to open your browser...");
	}
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
	err("  Search YouTube, get transcripts, read comments, and inspect channels");
	err("");
	err("Welcome! To get started, authenticate with your Stophy account.");
	err("");
	err("Tip: You can also set the STOPHY_API_KEY environment variable.");
	err("");

	const { mode } = await prompts({
		type: "select",
		name: "mode",
		message: "How do you want to authenticate?",
		choices: [
			{ title: "Login with browser (recommended)", value: "browser" },
			{ title: "Enter API key manually", value: "api-key" },
		],
		initial: 0,
	});

	if (mode === "browser") {
		await doBrowserLogin();
	} else if (mode === "api-key") {
		await doApiKeyLogin();
	}

	return resolveRuntimeConfig();
}
