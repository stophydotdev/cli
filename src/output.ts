import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { RequestResult } from "./client.js";
import type { LogsData, UsageData } from "./types/account.js";
import type { OutputOptions } from "./types/api.js";

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

export function writeOutput(content: string, output?: string, silent = false) {
	if (output) {
		const dir = dirname(output);
		if (dir) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(
			output,
			content.endsWith("\n") ? content : `${content}\n`,
			"utf8",
		);
		if (!silent) {
			console.error(`Output written to: ${output}`);
		}
		return;
	}

	process.stdout.write(content.endsWith("\n") ? content : `${content}\n`);
}

export function printJson(value: unknown) {
	console.log(JSON.stringify(value as Jsonish, null, 2));
}

export function handleOutput(value: unknown, options: OutputOptions = {}) {
	const content = JSON.stringify(value as Jsonish, null, 2);
	writeOutput(content, options.output, Boolean(options.output));
}

export function printUsage(
	result: RequestResult<UsageData>,
	options: OutputOptions = {},
) {
	if (options.json || options.output) {
		handleOutput(result.body, options);
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
	result: RequestResult<LogsData>,
	options: OutputOptions = {},
) {
	if (options.json || options.output) {
		handleOutput(result.body, options);
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
