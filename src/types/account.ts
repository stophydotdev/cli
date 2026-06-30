import type { OutputOptions } from "./api.js";

export type UsageDays = "today" | "7" | "30";

export interface CreditsData {
	credits: number;
}

export interface UsageOptions extends OutputOptions {
	days?: UsageDays;
}

export interface UsageItem {
	date: string;
	requests: number;
	credits: number;
}

export interface UsageData {
	items: UsageItem[];
}

export interface LogsOptions extends OutputOptions {
	days?: UsageDays;
	endpoint?: string;
}

export interface LogEntry {
	id: string;
	userId: string;
	apiKeyId: string | null;
	apiKeyName: string | null;
	endpoint: string;
	method: string;
	status: number;
	credits: number;
	durationMs: number | null;
	response: string | null;
	createdAt: string;
}

export interface LogsData {
	logs: LogEntry[];
	endpoints: string[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
