import type { Command } from "commander";
import { green } from "../color.js";
import {
	clearStoredAuth,
	getConfigPath,
	loadConfig,
	resolveRuntimeConfig,
} from "../config.js";

function maskSecret(value?: string) {
	if (!value) {
		return "Not set";
	}
	if (value.length <= 10) {
		return `${value.slice(0, 3)}...`;
	}
	return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function hasSessionCookie(sessionCookie?: string) {
	return Boolean(sessionCookie?.trim());
}

function formatStatus(apiKey?: string, sessionCookie?: string) {
	return apiKey || hasSessionCookie(sessionCookie)
		? green("Authenticated")
		: "Not authenticated";
}

function formatApiKeySource(source?: "env" | "stored") {
	if (source === "env") return " (via STOPHY_API_KEY)";
	if (source === "stored") return " (via stored credentials)";
	return "";
}

export function registerAccountCommands(program: Command) {
	program
		.command("view-config")
		.description("Show your current config and auth status")
		.action(async () => {
			const stored = await loadConfig();
			const runtime = await resolveRuntimeConfig();
			const isAuthed = Boolean(runtime.apiKey || stored.sessionCookie?.trim());

			process.stderr.write("┌─────────────────────────────────────────┐\n");
			process.stderr.write("│          Stophy Configuration           │\n");
			process.stderr.write("└─────────────────────────────────────────┘\n");
			process.stderr.write("\n");
			process.stderr.write(
				`Status: ${formatStatus(runtime.apiKey, stored.sessionCookie)}\n`,
			);
			process.stderr.write("\n");

			if (isAuthed) {
				process.stderr.write(
					`API Key:       ${maskSecret(runtime.apiKey)}${formatApiKeySource(runtime.apiKeySource)}\n`,
				);
				process.stderr.write(
					`Session:       ${hasSessionCookie(stored.sessionCookie) ? green("Saved") : "Not saved"}\n`,
				);
				process.stderr.write(`API URL:       ${runtime.baseUrl}\n`);
				process.stderr.write(`Frontend URL:  ${runtime.frontendUrl}\n`);
				process.stderr.write(`Config:        ${getConfigPath()}\n`);
				process.stderr.write("\n");
				process.stderr.write("Commands:\n");
				process.stderr.write("  stophy logout       Clear credentials\n");
				process.stderr.write("  stophy login        Re-authenticate\n");
			} else {
				process.stderr.write(
					"Run any command to start authentication, or use:\n",
				);
				process.stderr.write(
					"  stophy login        Authenticate with browser or API key\n",
				);
			}
		});

	program
		.command("logout")
		.description("Clear saved credentials")
		.action(async () => {
			await clearStoredAuth();
			process.stderr.write(green("Cleared saved Stophy credentials.\n"));
		});
}
