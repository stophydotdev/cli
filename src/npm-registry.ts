const REGISTRY_URL = "https://registry.npmjs.org";

export interface LatestVersionResult {
	version?: string;
	unreachable: boolean;
	error?: string;
}

export async function getLatestVersion(
	packageName: string,
	timeoutMs = 2000,
): Promise<LatestVersionResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(
			`${REGISTRY_URL}/${encodeURIComponent(packageName).replace("%40", "@")}/latest`,
			{
				signal: controller.signal,
				headers: { Accept: "application/json" },
			},
		);

		if (!response.ok) {
			return { unreachable: true, error: `HTTP ${response.status}` };
		}

		const data = (await response.json()) as { version?: string };
		if (typeof data.version !== "string") {
			return { unreachable: true, error: "Invalid registry response" };
		}
		return { version: data.version, unreachable: false };
	} catch (error) {
		return {
			unreachable: true,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	} finally {
		clearTimeout(timeout);
	}
}

export function compareVersions(a: string, b: string): number {
	const parse = (v: string): number[] => {
		const stripped = v.replace(/^v/, "").split(/[-+]/)[0];
		return stripped.split(".").map((part) => {
			const n = Number.parseInt(part, 10);
			return Number.isFinite(n) ? n : 0;
		});
	};

	const aParts = parse(a);
	const bParts = parse(b);
	const length = Math.max(aParts.length, bParts.length);

	for (let i = 0; i < length; i++) {
		const ai = aParts[i] ?? 0;
		const bi = bParts[i] ?? 0;
		if (ai !== bi) return ai - bi;
	}
	return 0;
}
