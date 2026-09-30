import { mkdirSync } from "node:fs";
import { expect, test } from "bun:test";

const home = `/tmp/stophy-cli-catalog-${process.pid}`;
mkdirSync(home, { recursive: true });
process.env.XDG_CONFIG_HOME = home;

const endpoint = {
	id: "youtube.search",
	method: "POST" as const,
	path: "/v1/youtube/search",
	credits: 1,
	keyless: true,
	input: { type: "object", properties: {}, additionalProperties: false },
};

const newer = { ...endpoint, id: "maps.search", keyless: false, credits: 3 };

test("uses a fresh cache, refreshes a stale one, and keeps it when refresh fails", async () => {
	const { loadCatalog, planCatalog } = await import("../src/catalog.ts");
	const sample = Date.parse("2026-04-01T00:00:00.000Z");
	expect(planCatalog({ fetchedAt: sample - 60_000, now: sample, force: false })).toBe("fresh");
	expect(planCatalog({ fetchedAt: sample - 6 * 60_000, now: sample, force: false })).toBe("stale");
	expect(planCatalog({ fetchedAt: sample - 1000, now: sample, force: true })).toBe("fetch");
	expect(planCatalog({ fetchedAt: undefined, now: sample, force: false })).toBe("fetch");

	const file = `${home}/catalog.json`;
	let fetches = 0;
	const fresh = await loadCatalog({
		file,
		now: Date.now(),
		force: false,
		fetch: async () => {
			fetches += 1;
			return { endpoints: [endpoint], sources: [] };
		},
		warn: () => {},
	});
	expect(fetches).toBe(1);
	expect(fresh.endpoints.map((item) => item.id)).toEqual(["youtube.search"]);
	expect(fresh.background).toBeUndefined();

	const writtenAt = Date.now();
	const again = await loadCatalog({
		file,
		now: writtenAt,
		force: false,
		fetch: async () => {
			fetches += 1;
			return { endpoints: [newer], sources: [] };
		},
		warn: () => {},
	});
	expect(fetches).toBe(1);
	expect(again.endpoints[0]?.id).toBe("youtube.search");

	const warnings: string[] = [];
	const stale = await loadCatalog({
		file,
		now: writtenAt + 6 * 60_000,
		force: false,
		fetch: async () => {
			throw new Error("offline");
		},
		warn: (message) => warnings.push(message),
	});
	expect(stale.endpoints[0]?.id).toBe("youtube.search");
	await stale.background;
	expect(warnings[0]).toContain("offline");
	expect(warnings[0]).toContain("Using the cached catalog");

	await expect(
		loadCatalog({
			file,
			now: writtenAt,
			force: true,
			fetch: async () => {
				throw new Error("offline");
			},
			warn: () => {},
		}),
	).rejects.toThrow("Could not load the endpoint catalog: offline");
});
