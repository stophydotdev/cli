import type { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };
import { formatBalance, usageDataSchema } from "../account.js";
import { request } from "../client.js";
import { getConfigPath, resolveRuntimeConfig } from "../config.js";
import { CliError } from "../errors.js";

function useColor(): boolean {
	if (process.env.NO_COLOR !== undefined) return false;
	if (process.env.FORCE_COLOR !== undefined)
		return process.env.FORCE_COLOR !== "0";
	return Boolean(process.stdout.isTTY);
}

const colorOn = useColor();
const c = (code: string) => (colorOn ? code : "");
const reset = c("\x1b[0m");
const dim = c("\x1b[2m");
const bold = c("\x1b[1m");
const green = c("\x1b[32m");
const red = c("\x1b[31m");
const accent = c("\x1b[38;2;0;98;57m");

interface StatusResult {
	version: string;
	authenticated: boolean;
	source: string;
	balance?: string;
	error?: string;
}

async function getStatus(): Promise<StatusResult> {
	const { apiKey, apiKeySource, sessionCookie } = await resolveRuntimeConfig();
	const authenticated = Boolean(apiKey || sessionCookie);
	const source = apiKey
		? (apiKeySource ?? "stored")
		: sessionCookie
			? "session"
			: "none";

	const result: StatusResult = {
		version: packageJson.version,
		authenticated,
		source,
	};

	if (!authenticated) {
		return result;
	}

	try {
		const response = await request({
			method: "GET",
			path: "/v1/usage",
			accept: "application/json",
		});
		const usage = usageDataSchema.safeParse(response.json);
		if (!usage.success)
			throw new CliError("Server returned an unexpected response shape.");
		result.balance = formatBalance(usage.data.balanceMicros);
	} catch (error) {
		result.error =
			error instanceof Error ? error.message : "Failed to fetch account info";
	}

	return result;
}

export function registerStatusCommand(program: Command) {
	program
		.command("status")
		.description("Show CLI version, auth status, and balance")
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const status = await getStatus();

			if (options.json) {
				console.log(JSON.stringify(status, null, 2));
				if (status.error) process.exitCode = 1;
				return;
			}

			console.log("");
			console.log(
				`  ${accent}▶ ${bold}stophy${reset} ${dim}cli v${status.version}${reset}`,
			);
			console.log("");

			if (status.authenticated) {
				const sourceLabel =
					status.source === "env"
						? "via STOPHY_API_KEY"
						: status.source === "session"
							? "via saved session"
							: "via stored credentials";
				console.log(
					`  ${green}●${reset} Authenticated ${dim}${sourceLabel}${reset}`,
				);
			} else {
				console.log(`  ${red}●${reset} Not authenticated`);
				console.log(`  ${dim}Run 'stophy login' to authenticate${reset}`);
				console.log("");
				return;
			}

			if (status.error) {
				console.log(
					`  ${dim}Could not fetch account info: ${status.error}${reset}`,
				);
			} else if (status.balance) {
				console.log(`  ${dim}Balance:${reset} ${status.balance}`);
			}

			console.log(`  ${dim}Config:${reset}  ${getConfigPath()}`);
			console.log("");

			if (status.error) process.exitCode = 1;
		});
}
