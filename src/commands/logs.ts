import type { Command } from "commander";
import { type LogEntry, logsDataSchema } from "../account.js";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput } from "../output.js";
import type { OutputOptions } from "../types/api.js";

interface LogsOptions extends OutputOptions {
	days?: string;
	endpoint?: string;
	page?: string;
}

export function registerLogsCommand(program: Command) {
	program
		.command("logs")
		.description("Show request logs for your API key")
		.option("--days <days>", "How many days back to include, from 1 to 90", "7")
		.option("--page <page>", "Page number, starting at 0", "0")
		.option(
			"--endpoint <endpoint>",
			"Filter by endpoint id, for example youtube.search",
		)
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy logs
  $ stophy logs --days 1 --endpoint youtube.search
  $ stophy logs --page 1 --json
`,
		)
		.action(async (options: LogsOptions) => {
			const days = integerOption(options.days ?? "7", "--days", 1, 90);
			const page = pageOption(options.page ?? "0");
			const response = await request({
				method: "GET",
				path: "/v1/logs",
				accept: "application/json",
				params: {
					days: String(days),
					page: String(page),
					endpoint: options.endpoint,
				},
			});
			const parsed = logsDataSchema.safeParse(response.json);
			if (!parsed.success)
				throw new CliError("Server returned an unexpected response shape.");
			if (options.json || options.output) {
				handleOutput(parsed.data, options);
				return;
			}
			printLogTable(parsed.data.logs);
			const pages = parsed.data.totalPages === 0 ? 1 : parsed.data.totalPages;
			process.stderr.write(
				`page ${parsed.data.page + 1} of ${pages} (${parsed.data.total} requests in the last ${days} ${days === 1 ? "day" : "days"})\n`,
			);
		});
}

function pageOption(value: string): number {
	if (!/^\d+$/u.test(value)) {
		throw new CliError("`--page` must be an integer of 0 or greater.");
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) {
		throw new CliError("`--page` must be an integer of 0 or greater.");
	}
	return parsed;
}

function integerOption(
	value: string,
	label: string,
	min: number,
	max: number,
): number {
	if (!/^\d+$/u.test(value)) {
		throw new CliError(
			`\`${label}\` must be an integer from ${min} to ${max}.`,
		);
	}
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
		throw new CliError(
			`\`${label}\` must be an integer from ${min} to ${max}.`,
		);
	}
	return parsed;
}

function printLogTable(logs: readonly LogEntry[]) {
	if (logs.length === 0) {
		console.log("No results.");
		return;
	}
	console.table(
		logs.map((log) => ({
			endpoint: log.endpoint,
			method: log.method,
			status: log.status,
			credits: log.credits,
			createdAt: formatTimestamp(log.createdAt),
			apiKey: log.apiKeyName ?? "-",
		})),
	);
}

function formatTimestamp(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
