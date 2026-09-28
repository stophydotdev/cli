import { z } from "zod";

/** One API credit is 2000 micros ($0.002), the same ratio the API uses for billing. */
export const MICROS_PER_CREDIT = 2_000;

const MICROS_PER_DOLLAR = 1_000_000;

/** `GET /v1/usage` body. This route accepts an API key. */
export const usageDataSchema = z.object({
	balanceMicros: z.number(),
	creditsUsed: z.number(),
	requestCount: z.number(),
});

export type UsageData = z.infer<typeof usageDataSchema>;

const logEntrySchema = z.object({
	id: z.string(),
	apiKeyId: z.string().nullable(),
	apiKeyName: z.string().nullable(),
	endpoint: z.string(),
	method: z.string(),
	status: z.number(),
	credits: z.number(),
	durationMs: z.number().nullable(),
	response: z.string().nullable(),
	createdAt: z.string(),
});

/** `GET /v1/logs` body. This route accepts an API key. */
export const logsDataSchema = z.object({
	logs: z.array(logEntrySchema),
	endpoints: z.array(z.string()),
	total: z.number(),
	page: z.number(),
	pageSize: z.number(),
	totalPages: z.number(),
});

export type LogsData = z.infer<typeof logsDataSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;

export function creditsFromMicros(micros: number): number | undefined {
	if (!Number.isFinite(micros)) return undefined;
	return Math.floor(micros / MICROS_PER_CREDIT);
}

export function formatBalance(micros: number): string {
	const credits = creditsFromMicros(micros);
	const usd = (micros / MICROS_PER_DOLLAR).toFixed(2);
	if (credits === undefined) return `$${usd}`;
	return `${credits.toLocaleString("en-US")} credits ($${usd})`;
}
