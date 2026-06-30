import { chmodSync } from "node:fs";
import Conf from "conf";
import { CliError } from "./errors.js";

export interface CliConfig {
	apiKey?: string;
	baseUrl?: string;
	frontendUrl?: string;
	sessionCookie?: string;
	sessionExpiresAt?: string;
}

export const DEFAULT_BASE_URL = "https://api.stophy.dev";
export const DEFAULT_FRONTEND_URL = "https://stophy.dev";

const store = new Conf<CliConfig>({
	projectName: "stophy",
	projectSuffix: "",
	configName: "config",
});

export function getConfigPath() {
	return store.path;
}

function secureConfigFile() {
	try {
		chmodSync(store.path, 0o600);
	} catch {
		// ignore
	}
}

export async function loadConfig(): Promise<CliConfig> {
	try {
		return {
			apiKey: normalizeApiKey(store.get("apiKey")),
			baseUrl: normalizeBaseUrl(store.get("baseUrl")),
			frontendUrl: normalizeBaseUrl(store.get("frontendUrl")),
			sessionCookie: normalizeSessionCookie(store.get("sessionCookie")),
			sessionExpiresAt: normalizeSessionExpiry(store.get("sessionExpiresAt")),
		};
	} catch {
		throw new CliError(`Failed to read config at ${store.path}.`);
	}
}

export async function saveConfig(config: CliConfig) {
	store.store = {
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		frontendUrl: config.frontendUrl,
		sessionCookie: config.sessionCookie,
		sessionExpiresAt: config.sessionExpiresAt,
	};
	secureConfigFile();
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
	frontendUrl: string,
	sessionId: string,
	codeChallenge: string,
) {
	const url = new URL("/cli-auth", frontendUrl);
	url.searchParams.set("session_id", sessionId);
	url.searchParams.set("code_challenge", codeChallenge);
	return url.toString();
}
