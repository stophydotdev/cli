import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { CliError } from "./errors";

export interface BrowserLoginResult {
	apiKey: string | null;
	baseUrl?: string;
	sessionCookie: string;
	sessionExpiresAt?: string;
}

interface BrowserLoginPayload extends Partial<BrowserLoginResult> {
	denied?: boolean;
	state?: string;
}

export interface BrowserLoginServer {
	port: number;
	result: Promise<BrowserLoginResult>;
	state: string;
}

function jsonResponse(body: Record<string, unknown>) {
	return JSON.stringify(body, null, 2);
}

export async function startBrowserLogin(
	timeoutMs = 5 * 60 * 1000
): Promise<BrowserLoginServer> {
	const state = randomUUID();

	return await new Promise<BrowserLoginServer>((resolve, reject) => {
		const server = createServer((req, res) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Headers", "Content-Type");
			res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
			res.setHeader("Access-Control-Allow-Private-Network", "true");

			if (req.method === "OPTIONS") {
				res.statusCode = 204;
				res.end();
				return;
			}

			if (req.method !== "POST" || req.url !== "/session") {
				res.statusCode = 404;
				res.setHeader("Content-Type", "application/json");
				res.end(jsonResponse({ error: "Not found" }));
				return;
			}

			let raw = "";
			req.setEncoding("utf8");
			req.on("data", (chunk) => {
				raw += chunk;
			});
			req.on("end", () => {
				try {
					const payload = JSON.parse(raw) as BrowserLoginPayload;
					if (payload.state !== state) {
						res.statusCode = 400;
						res.setHeader("Content-Type", "application/json");
						res.end(jsonResponse({ error: "State mismatch" }));
						return;
					}

					if (payload.denied) {
						res.statusCode = 200;
						res.setHeader("Content-Type", "application/json");
						res.end(jsonResponse({ ok: true }));
						server.close();
						fail(new CliError("Authorization denied."));
						return;
					}

					if (!payload.sessionCookie) {
						res.statusCode = 400;
						res.setHeader("Content-Type", "application/json");
						res.end(jsonResponse({ error: "Session cookie missing" }));
						return;
					}

					res.statusCode = 200;
					res.setHeader("Content-Type", "application/json");
					res.end(jsonResponse({ ok: true }));
					server.close();
					finish({
						apiKey: payload.apiKey ?? null,
						baseUrl: payload.baseUrl,
						sessionCookie: payload.sessionCookie,
						sessionExpiresAt: payload.sessionExpiresAt,
					});
				} catch {
					res.statusCode = 400;
					res.setHeader("Content-Type", "application/json");
					res.end(jsonResponse({ error: "Invalid JSON payload" }));
				}
			});
		});

		let finish: (payload: BrowserLoginResult) => void = () => undefined;
		let fail: (error: CliError) => void = () => undefined;
		const result = new Promise<BrowserLoginResult>(
			(resolveResult, rejectResult) => {
				finish = resolveResult;
				fail = rejectResult;
			}
		);

		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				reject(new CliError("Could not start local callback server."));
				server.close();
				return;
			}
			resolve({ port: address.port, result, state });
		});

		const timeout = setTimeout(() => {
			server.close();
			const error = new CliError(
				"Browser login timed out. Try `stophy login --browser` again."
			);
			fail(error);
		}, timeoutMs);

		server.on("close", () => clearTimeout(timeout));
	});
}
