import type { RequestResult } from "./client";

type Jsonish =
	| null
	| boolean
	| number
	| string
	| Jsonish[]
	| { [key: string]: Jsonish };

function printTable(rows: Record<string, unknown>[]) {
	if (rows.length === 0) {
		console.log("No results.");
		return;
	}

	console.table(rows);
}

function formatTimestamp(value: unknown) {
	if (typeof value !== "string") {
		return "-";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function printJson(value: unknown) {
	console.log(JSON.stringify(value as Jsonish, null, 2));
}

export function printUsage(
	result: RequestResult<{ items: Record<string, unknown>[] }>,
	json = false,
) {
	if (json) {
		printJson(result.body);
		return;
	}

	printTable(
		result.body.data.items.map((item) => ({
			date: item.date,
			requests: item.requests,
			credits: item.credits,
		})),
	);
}

export function printLogs(
	result: RequestResult<{
		endpoints: string[];
		logs: Record<string, unknown>[];
	}>,
	json = false,
) {
	if (json) {
		printJson(result.body);
		return;
	}

	printTable(
		result.body.data.logs.map((log) => ({
			endpoint: log.endpoint,
			method: log.method,
			status: log.status,
			credits: log.credits,
			createdAt: formatTimestamp(log.createdAt),
			apiKey: log.apiKeyName ?? "-",
		})),
	);
}
