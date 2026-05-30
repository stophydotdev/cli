import type { Command } from "commander";
import { green } from "../color";
import {
	clearStoredAuth,
	getConfigPath,
	loadConfig,
	resolveRuntimeConfig,
} from "../config";

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

export function registerAccountCommands(program: Command) {
	program
		.command("view-config")
		.description("Show your current config and auth status")
		.action(async () => {
			const stored = await loadConfig();
			const runtime = await resolveRuntimeConfig();

			console.log("┌─────────────────────────────────────────┐");
			console.log("│          Stophy Configuration           │");
			console.log("└─────────────────────────────────────────┘");
			console.log("");
			console.log(
				`Status:        ${formatStatus(runtime.apiKey, stored.sessionCookie)}`,
			);
			console.log(`API Key:       ${maskSecret(runtime.apiKey)}`);
			console.log(
				`Session:       ${hasSessionCookie(stored.sessionCookie) ? green("Saved") : "Not saved"}`,
			);
			console.log(`API URL:       ${runtime.baseUrl}`);
			console.log(`Frontend URL:  ${runtime.frontendUrl}`);
			console.log(`Config:        ${getConfigPath()}`);
			console.log("");
			console.log("Commands:");
			console.log("  stophy logout       Clear credentials");
			console.log("  stophy login        Re-authenticate");
		});

	program
		.command("logout")
		.description("Clear saved credentials")
		.action(async () => {
			await clearStoredAuth();
			console.log(green("Cleared saved Stophy credentials."));
		});
}
