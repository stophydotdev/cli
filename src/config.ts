import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { CliError } from "./errors";

export interface CliConfig {
	apiKey?: string;
	baseUrl?: string;
	frontendUrl?: string;
	sessionCookie?: string;
	sessionExpiresAt?: string;
}

export const DEFAULT_BASE_URL = "https://api.stophy.dev";
export const DEFAULT_FRONTEND_URL = "https://stophy.dev";
const CONFIG_DIR =
	process.platform === "win32"
		? join(process.env.APPDATA ?? homedir(), "stophy")
		: join(homedir(), ".config", "stophy");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export function getConfigPath() {
	return CONFIG_PATH;
}

export async function loadConfig(): Promise<CliConfig> {
	try {
		const raw = await readFile(CONFIG_PATH, "utf8");
		const parsed = JSON.parse(raw) as CliConfig;
		return {
			apiKey: normalizeApiKey(parsed.apiKey),
			baseUrl: normalizeBaseUrl(parsed.baseUrl),
			frontendUrl: normalizeBaseUrl(parsed.frontendUrl),
			sessionCookie: normalizeSessionCookie(parsed.sessionCookie),
			sessionExpiresAt: normalizeSessionExpiry(parsed.sessionExpiresAt),
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return {};
		}
		throw new CliError(`Failed to read config at ${CONFIG_PATH}.`);
	}
}

export async function saveConfig(config: CliConfig) {
	await mkdir(dirname(CONFIG_PATH), { recursive: true });
	const tmp = `${CONFIG_PATH}.tmp`;
	await writeFile(tmp, `${JSON.stringify(config, null, 2)}\n`, "utf8");
	await chmod(tmp, 0o600);
	await rename(tmp, CONFIG_PATH);
}

export async function setStoredApiKey(apiKey: string) {
	const config = await loadConfig();
	config.apiKey = normalizeApiKey(apiKey);
	await saveConfig(config);
	return config;
}

export async function clearStoredAuth() {
	const config = await loadConfig();
	const nextConfig: CliConfig = {
		baseUrl: config.baseUrl,
		frontendUrl: config.frontendUrl,
	};
	await saveConfig(nextConfig);
	return nextConfig;
}

export async function resolveRuntimeConfig() {
	const config = await loadConfig();
	const envApiKey = normalizeApiKey(process.env.STOPHY_API_KEY);
	const apiKey = envApiKey ?? normalizeApiKey(config.apiKey);
	const apiKeySource: "env" | "stored" | undefined = envApiKey
		? "env"
		: config.apiKey
			? "stored"
			: undefined;
	const baseUrl =
		normalizeBaseUrl(process.env.STOPHY_BASE_URL ?? config.baseUrl) ??
		DEFAULT_BASE_URL;
	const frontendUrl =
		normalizeBaseUrl(process.env.STOPHY_FRONTEND_URL ?? config.frontendUrl) ??
		DEFAULT_FRONTEND_URL;
	return {
		apiKey,
		apiKeySource,
		baseUrl,
		frontendUrl,
		sessionCookie: normalizeSessionCookie(config.sessionCookie),
		sessionExpiresAt: normalizeSessionExpiry(config.sessionExpiresAt),
	};
}

export function normalizeApiKey(apiKey?: string | null) {
	const value = apiKey?.trim();
	return value ? value : undefined;
}

export function normalizeBaseUrl(baseUrl?: string | null) {
	const value = baseUrl?.trim();
	if (!value) {
		return;
	}
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function normalizeSessionCookie(sessionCookie?: string | null) {
	const value = sessionCookie?.trim();
	return value ? value : undefined;
}

export function normalizeSessionExpiry(sessionExpiresAt?: string | null) {
	const value = sessionExpiresAt?.trim();
	return value ? value : undefined;
}

export function validateApiKey(apiKey: string) {
	if (!apiKey.startsWith("st_")) {
		throw new CliError("API key must start with `st_`.");
	}
	if (apiKey.length < 10) {
		throw new CliError("API key is too short.");
	}
	return apiKey;
}

export function getBrowserLoginUrl(
	baseUrl: string,
	frontendUrl: string,
	cliPort: number,
	cliState: string,
) {
	const url = new URL("/cli/complete", frontendUrl);
	url.searchParams.set("cliPort", String(cliPort));
	url.searchParams.set("cliState", cliState);
	url.searchParams.set("apiBaseUrl", baseUrl);
	return url.toString();
}
