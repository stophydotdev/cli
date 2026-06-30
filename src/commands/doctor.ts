import type { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };
import { getConfigPath, resolveRuntimeConfig } from "../config.js";
import { compareVersions, getLatestVersion } from "../npm-registry.js";

type CheckStatus = "pass" | "warn" | "fail";

interface CheckResult {
	name: string;
	status: CheckStatus;
	message: string;
	fix?: string;
}

const MIN_NODE_MAJOR = 18;
const REACHABILITY_WARN_MS = 2000;

function useColor(): boolean {
	if (process.env.NO_COLOR !== undefined) return false;
	if (process.env.FORCE_COLOR !== undefined)
		return process.env.FORCE_COLOR !== "0";
	if (process.env.TERM === "dumb") return false;
	return Boolean(process.stdout.isTTY);
}

const colorOn = useColor();
const c = (code: string) => (colorOn ? code : "");
const reset = c("\x1b[0m");
const dim = c("\x1b[2m");
const bold = c("\x1b[1m");
const green = c("\x1b[32m");
const red = c("\x1b[31m");
const yellow = c("\x1b[33m");
const accent = c("\x1b[38;2;0;98;57m");

function statusIcon(status: CheckStatus): string {
	switch (status) {
		case "pass":
			return `${green}●${reset}`;
		case "warn":
			return `${yellow}!${reset}`;
		case "fail":
			return `${red}✗${reset}`;
	}
}

function maskApiKey(key: string): string {
	if (!key) return "";
	return `st_...${key.slice(-4)}`;
}

function dimParentheticals(message: string): string {
	return message.replace(/\(([^)]*)\)/g, `${dim}($1)${reset}`);
}

interface ApiPing {
	status: number;
	durationMs: number;
	error?: string;
	credits?: number;
}

async function pingCredits(
	apiKey: string | undefined,
	sessionCookie: string | undefined,
	baseUrl: string,
): Promise<ApiPing> {
	const url = new URL("/v1/credits", `${baseUrl}/`);
	const start = Date.now();
	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				...(sessionCookie ? { Cookie: sessionCookie } : {}),
				"Content-Type": "application/json",
			},
		});
		const durationMs = Date.now() - start;
		let credits: number | undefined;
		try {
			const body = (await response.json()) as { data?: { credits?: number } };
			credits = body.data?.credits;
		} catch {
			credits = undefined;
		}
		return { status: response.status, durationMs, credits };
	} catch (error) {
		return {
			status: 0,
			durationMs: Date.now() - start,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function checkCliVersion(latest: {
	version?: string;
	unreachable: boolean;
}): CheckResult {
	const current = packageJson.version;
	if (latest.unreachable || !latest.version) {
		return {
			name: "CLI Version",
			status: "warn",
			message: `v${current} (registry unreachable)`,
		};
	}
	if (compareVersions(current, latest.version) >= 0) {
		return {
			name: "CLI Version",
			status: "pass",
			message: `v${current} (latest)`,
		};
	}
	return {
		name: "CLI Version",
		status: "warn",
		message: `v${current} (v${latest.version} available)`,
		fix: "npm install -g @stophy/cli",
	};
}

function checkNodeRuntime(): CheckResult {
	const version = process.versions.node;
	const major = Number.parseInt(version.split(".")[0], 10);
	if (!Number.isFinite(major) || major < MIN_NODE_MAJOR) {
		return {
			name: "Node Runtime",
			status: "fail",
			message: `v${version} (requires >=${MIN_NODE_MAJOR})`,
			fix: `Upgrade Node to >=${MIN_NODE_MAJOR}`,
		};
	}
	return { name: "Node Runtime", status: "pass", message: `v${version}` };
}

function checkApiKey(
	apiKey: string | undefined,
	sessionCookie: string | undefined,
	source: string,
): CheckResult {
	if (apiKey) {
		return {
			name: "API Key",
			status: "pass",
			message: `${maskApiKey(apiKey)} (${source})`,
		};
	}
	if (sessionCookie) {
		return {
			name: "API Key",
			status: "pass",
			message: "session cookie (stored)",
		};
	}
	return {
		name: "API Key",
		status: "fail",
		message: "not found",
		fix: "stophy login",
	};
}

function checkReachability(baseUrl: string, ping: ApiPing | null): CheckResult {
	if (!ping) {
		return {
			name: "API Reachability",
			status: "fail",
			message: "not checked (no credentials)",
		};
	}
	if (ping.status === 0) {
		return {
			name: "API Reachability",
			status: "fail",
			message: `${baseUrl} (${ping.error || "unreachable"})`,
			fix: "Check network/DNS or firewall",
		};
	}
	if (ping.durationMs > REACHABILITY_WARN_MS) {
		return {
			name: "API Reachability",
			status: "warn",
			message: `${ping.durationMs}ms (slow)`,
		};
	}
	return {
		name: "API Reachability",
		status: "pass",
		message: `${ping.durationMs}ms`,
	};
}

function checkKeyValidity(ping: ApiPing | null): CheckResult {
	if (!ping) {
		return { name: "API Key Validity", status: "fail", message: "not checked" };
	}
	if (ping.status === 401 || ping.status === 403) {
		return {
			name: "API Key Validity",
			status: "fail",
			message: `HTTP ${ping.status} (invalid or revoked)`,
			fix: "stophy login",
		};
	}
	if (ping.status === 0) {
		return {
			name: "API Key Validity",
			status: "fail",
			message: "could not reach API",
		};
	}
	if (ping.status >= 200 && ping.status < 300) {
		return { name: "API Key Validity", status: "pass", message: "accepted" };
	}
	return {
		name: "API Key Validity",
		status: "warn",
		message: `HTTP ${ping.status}`,
	};
}

function checkCredits(ping: ApiPing | null): CheckResult {
	if (!ping || ping.status === 0 || ping.status >= 400) {
		return { name: "Credits", status: "warn", message: "unavailable" };
	}
	if (ping.credits === undefined) {
		return {
			name: "Credits",
			status: "warn",
			message: "no credit info in response",
		};
	}
	const label = `${ping.credits.toLocaleString("en-US")} remaining`;
	if (ping.credits === 0) {
		return {
			name: "Credits",
			status: "fail",
			message: "0 remaining",
			fix: "Top up at stophy.dev/dashboard",
		};
	}
	if (ping.credits < 100) {
		return { name: "Credits", status: "warn", message: label };
	}
	return { name: "Credits", status: "pass", message: label };
}

async function runChecks(): Promise<CheckResult[]> {
	const { apiKey, apiKeySource, baseUrl, sessionCookie } =
		await resolveRuntimeConfig();
	const source = apiKey ? (apiKeySource ?? "stored") : "none";

	const [latest, ping] = await Promise.all([
		getLatestVersion(packageJson.name),
		apiKey || sessionCookie
			? pingCredits(apiKey, sessionCookie, baseUrl)
			: Promise.resolve(null),
	]);

	return [
		checkCliVersion(latest),
		checkNodeRuntime(),
		checkApiKey(apiKey, sessionCookie, source),
		checkReachability(baseUrl, ping),
		checkKeyValidity(ping),
		checkCredits(ping),
		{ name: "Config", status: "pass", message: getConfigPath() },
	];
}

function padName(name: string, width: number): string {
	return name.length >= width ? name : name + " ".repeat(width - name.length);
}

function renderChecks(checks: CheckResult[]): void {
	const width = Math.max(...checks.map((c) => c.name.length)) + 2;

	console.log("");
	console.log(
		`  ${accent}▶ ${bold}stophy${reset} ${dim}doctor v${packageJson.version}${reset}`,
	);
	console.log("");

	for (const check of checks) {
		console.log(
			`  ${statusIcon(check.status)} ${padName(check.name, width)}${dimParentheticals(check.message)}`,
		);
		if (check.fix) {
			console.log(`    ${dim}→ ${check.fix}${reset}`);
		}
	}

	const counts = { pass: 0, warn: 0, fail: 0 };
	for (const check of checks) counts[check.status] += 1;

	console.log("");
	console.log(
		`  ${dim}${counts.pass} passed, ${counts.warn} warning${counts.warn === 1 ? "" : "s"}, ${counts.fail} failed${reset}`,
	);
	console.log("");
}

export function registerDoctorCommand(program: Command) {
	program
		.command("doctor")
		.description(
			"Run diagnostics on your CLI install, auth, and API connectivity",
		)
		.option("--json", "Print raw JSON")
		.action(async (options) => {
			const checks = await runChecks();

			if (options.json) {
				console.log(JSON.stringify({ checks }, null, 2));
			} else {
				renderChecks(checks);
			}

			if (checks.some((check) => check.status === "fail")) {
				process.exitCode = 1;
			}
		});
}
