import { createHash, randomBytes, randomUUID } from "node:crypto";
import { CliError } from "./errors.js";

export interface BrowserLoginResult {
	apiKey: string;
}

export interface BrowserLoginSession {
	codeChallenge: string;
	result: Promise<BrowserLoginResult>;
	sessionId: string;
}

export async function startBrowserLogin(
	baseUrl: string,
	timeoutMs = 10 * 60 * 1000,
): Promise<BrowserLoginSession> {
	const sessionId = randomUUID();
	const codeVerifier = randomBytes(32).toString("base64url");
	const codeChallenge = createHash("sha256")
		.update(codeVerifier)
		.digest("base64url");

	const initRes = await fetch(new URL("/api/cli/init", `${baseUrl}/`), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			session_id: sessionId,
			code_challenge: codeChallenge,
		}),
	}).catch((err: Error) => {
		throw new CliError(`Could not reach Stophy API: ${err.message}`);
	});

	if (!initRes.ok) {
		const body = (await initRes.json().catch(() => ({}))) as {
			error?: string;
		};
		throw new CliError(body.error ?? "Failed to start browser login.");
	}

	const result = new Promise<BrowserLoginResult>((resolve, reject) => {
		const deadline = Date.now() + timeoutMs;

		const poll = async () => {
			if (Date.now() >= deadline) {
				reject(
					new CliError(
						"Browser login timed out. Try `stophy login --browser` again.",
					),
				);
				return;
			}

			try {
				const res = await fetch(new URL("/api/cli/status", `${baseUrl}/`), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						session_id: sessionId,
						code_verifier: codeVerifier,
					}),
				});
				const data = (await res.json()) as {
					apiKey?: string;
					error?: string;
					status?: string;
				};

				if (data.status === "complete") {
					if (!data.apiKey) {
						reject(
							new CliError(
								"Authorization completed but no API key was returned.",
							),
						);
						return;
					}
					resolve({ apiKey: data.apiKey });
					return;
				}

				if (data.status === "denied") {
					reject(new CliError("Authorization denied."));
					return;
				}

				if (data.status === "expired") {
					reject(
						new CliError(
							"Browser login session expired. Try `stophy login --browser` again.",
						),
					);
					return;
				}
			} catch {
				// retry on next tick
			}

			setTimeout(poll, 2000);
		};

		setTimeout(poll, 2000);
	});

	return { codeChallenge, result, sessionId };
}
