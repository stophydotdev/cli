import type { Command } from "commander";
import { request } from "../client.js";
import { green } from "../color.js";
import {
	clearStoredAuth,
	getConfigPath,
	loadConfig,
	normalizeApiKey,
	resolveRuntimeConfig,
} from "../config.js";
import { CliError, statusFrom } from "../errors.js";

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
		.description("Log out and revoke this machine's key")
		.action(async () => {
			process.stderr.write(await logout(revokeKey));
		});
}

async function revokeKey(apiKey: string): Promise<void> {
	await request({
		method: "DELETE",
		path: "/v1/key",
		accept: "application/json",
		apiKey,
	});
}

export async function logout(
	revoke: (apiKey: string) => Promise<void>,
): Promise<string> {
	const stored = normalizeApiKey((await loadConfig()).apiKey);
	let note = "";
	if (stored) {
		try {
			await revoke(stored);
		} catch (error) {
			const reason =
				error instanceof CliError && statusFrom(error) !== undefined
					? "the server did not accept it, it may already be revoked"
					: "the server could not be reached";
			note = ` The key was not revoked (${reason}); you can revoke it at stophy.dev.`;
		}
	}
	await clearStoredAuth();
	const env = process.env.STOPHY_API_KEY
		? " STOPHY_API_KEY is still set in your environment."
		: "";
	const done = stored ? "Logged out." : "No saved key. Logged out.";
	return `${green(done)}${note}${env}\n`;
}
