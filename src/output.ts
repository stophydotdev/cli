import type { RequestResult } from "./client";
import { green } from "./color";

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

function printFooter<T>(result: RequestResult<T>) {
	const rows: { Metric: string; Value: string }[] = [
		{
			Metric: "Credits Left",
			Value: String(result.body.credit.remain),
		},
	];

	if (result.rateLimit.remaining) {
		rows.push({
			Metric: "Rate Limit",
			Value: `${result.rateLimit.remaining}/${result.rateLimit.limit ?? "?"} per min`,
		});
	}

	if (result.body.credit.used > 0) {
		rows.push({ Metric: "Cache", Value: result.body.cache });
	}

	console.table(
		rows.map((row) => ({
			Metric: green(row.Metric),
			Value: green(row.Value),
		})),
	);
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
	printFooter(result);
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
	printFooter(result);
}
