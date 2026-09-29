import { z } from "zod";
import { resolveRuntimeConfig } from "./config.js";
import { CliError } from "./errors.js";

const errorObject = z.object({
	code: z.string(),
	message: z.string(),
	retryable: z.boolean(),
	retryAfterSeconds: z.number().int().nonnegative().optional(),
	requestId: z.string().optional(),
});

const failureSchema = z.union([
	z.object({ error: z.string() }),
	z.object({ error: errorObject }),
]);

export interface RequestOptions {
	readonly method: "GET" | "POST" | "DELETE";
	readonly apiKey?: string;
	readonly path: string;
	readonly body?: Record<string, unknown>;
	readonly params?: Record<string, string | undefined>;
	readonly accept: "application/json" | "text/markdown";
}

export interface HttpResponse {
	readonly status: number;
	readonly text: string;
	readonly json: unknown;
	readonly retryAfter: string | null;
	readonly creditsUsed: string | null;
	readonly rateLimit: {
		readonly limit: string | null;
		readonly remaining: string | null;
		readonly reset: string | null;
	};
}

/** The only HTTP path. Throws `CliError` on network failure and non-2xx responses. */
export async function request(options: RequestOptions): Promise<HttpResponse> {
	const runtime = await resolveRuntimeConfig();
	const { baseUrl, sessionCookie } = runtime;
	const apiKey = options.apiKey ?? runtime.apiKey;
	const url = new URL(options.path, `${baseUrl}/`);
	for (const [key, value] of Object.entries(options.params ?? {})) {
		if (value) url.searchParams.set(key, value);
	}

	let response: Response;
	try {
		response = await fetch(url, {
			method: options.method,
			headers: {
				Accept: options.accept,
				...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				...(sessionCookie ? { Cookie: sessionCookie } : {}),
				...(options.method === "POST"
					? { "Content-Type": "application/json" }
					: {}),
			},
			...(options.method === "POST"
				? { body: JSON.stringify(options.body ?? {}) }
				: {}),
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message : "network error";
		throw new CliError(
			`Network request failed for ${url.toString()}: ${reason}`,
		);
	}

	const text = await response.text();
	const json = parseJsonBody(text, response.headers.get("content-type"));
	const retryAfter = response.headers.get("Retry-After");
	if (!response.ok) {
		const requestId =
			response.headers.get("X-Request-ID") ?? requestIdFrom(json);
		const message = failureMessage(json, response.status, retryAfter);
		throw new CliError(withRequestId(message, requestId), 1, {
			status: response.status,
			...(retryAfter ? { retryAfter } : {}),
		});
	}

	return {
		status: response.status,
		text,
		json,
		retryAfter,
		creditsUsed: response.headers.get("x-credits-used"),
		rateLimit: {
			limit: response.headers.get("X-RateLimit-Limit"),
			remaining: response.headers.get("X-RateLimit-Remaining"),
			reset: response.headers.get("X-RateLimit-Reset"),
		},
	};
}

function parseJsonBody(text: string, contentType: string | null): unknown {
	const trimmed = text.trim();
	const looksJson =
		(contentType ?? "").includes("json") ||
		trimmed.startsWith("{") ||
		trimmed.startsWith("[");
	if (!looksJson) return undefined;
	try {
		return parseJson(text);
	} catch {
		return undefined;
	}
}

function parseJson(text: string): unknown {
	return JSON.parse(text);
}

function requestIdFrom(body: unknown): string | null {
	const parsed = failureSchema.safeParse(body);
	if (!parsed.success || typeof parsed.data.error === "string") return null;
	return parsed.data.error.requestId ?? null;
}

/** Every API error ends with the request id, so a report can point at the exact call. */
export function withRequestId(
	message: string,
	requestId: string | null,
): string {
	return requestId === null ? message : `${message}\nRequest id: ${requestId}`;
}

function failureMessage(
	body: unknown,
	status: number,
	retryAfter: string | null,
): string {
	const parsed = failureSchema.safeParse(body);
	const retryFromBody =
		parsed.success && typeof parsed.data.error !== "string"
			? parsed.data.error.retryAfterSeconds
			: undefined;
	const retry =
		retryAfter ?? (retryFromBody === undefined ? null : String(retryFromBody));
	const message = parsed.success
		? typeof parsed.data.error === "string"
			? parsed.data.error
			: parsed.data.error.message
		: `Request failed with status ${status}.`;
	return retry === null ? message : `${message} Retry after ${retry}s.`;
}
