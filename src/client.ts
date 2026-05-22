import { resolveRuntimeConfig } from "./config";
import { CliError } from "./errors";

export interface ApiCredit {
	remain: number;
	used: number;
}

export interface ApiSuccess<T> {
	cache: "hit" | "miss";
	credit: ApiCredit;
	data: T;
	success: true;
}

export interface ApiFailure {
	details?: unknown;
	error: string;
	success: false;
}

export interface RequestResult<T> {
	body: ApiSuccess<T>;
	rateLimit: {
		limit: string | null;
		remaining: string | null;
		reset: string | null;
	};
	raw: ApiSuccess<T> | ApiFailure;
	status: number;
}

export interface RequestOptions {
	body?: Record<string, unknown>;
	method: "GET" | "POST";
	params?: Record<string, string | undefined>;
	path: string;
}

export async function request<T>(
	options: RequestOptions
): Promise<RequestResult<T>> {
	const { apiKey, baseUrl, sessionCookie } = await resolveRuntimeConfig();
	if (!(apiKey || sessionCookie)) {
		throw new CliError(
			"Missing API key. Run `stophy login --api-key` or `stophy login --browser`."
		);
	}

	const url = new URL(options.path, `${baseUrl}/`);
	for (const [key, value] of Object.entries(options.params ?? {})) {
		if (value) {
			url.searchParams.set(key, value);
		}
	}

	let response: Response;
	try {
		response = await fetch(url, {
			method: options.method,
			headers: {
				...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
				...(sessionCookie ? { Cookie: sessionCookie } : {}),
				"Content-Type": "application/json",
			},
			...(options.method === "POST"
				? { body: JSON.stringify(options.body ?? {}) }
				: {}),
		});
	} catch (error) {
		throw new CliError(
			`Network request failed for ${url.toString()}: ${(error as Error).message}`
		);
	}

	let raw: unknown;
	try {
		raw = await response.json();
	} catch {
		throw new CliError(
			`Server returned a non-JSON response with status ${response.status}.`
		);
	}

	const rateLimit = {
		limit: response.headers.get("X-RateLimit-Limit"),
		remaining: response.headers.get("X-RateLimit-Remaining"),
		reset: response.headers.get("X-RateLimit-Reset"),
	};

	if (!response.ok) {
		const failure = raw as Partial<ApiFailure>;
		throw new CliError(
			typeof failure.error === "string"
				? failure.error
				: `Request failed with status ${response.status}.`,
			1,
			{ rateLimit, status: response.status }
		);
	}

	const body = raw as Partial<ApiSuccess<T>>;
	if (body.success !== true || !("data" in body)) {
		throw new CliError("Server returned an unexpected response shape.");
	}

	return {
		body: body as ApiSuccess<T>,
		raw: body as ApiSuccess<T>,
		rateLimit,
		status: response.status,
	};
}
