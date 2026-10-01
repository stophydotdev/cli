import { expect, test } from "bun:test";
import { flagTokens, stripGlobalRefresh } from "../src/argv.ts";
import { formatDescribe, formatEndpointHelp, formatEndpointIndex, parseCall } from "../src/flags.ts";

const search = {
	id: "youtube.search",
	method: "POST",
	path: "/v1/youtube/search",
	credits: 1,
	keyless: false,
	input: {
		type: "object",
		properties: {
			query: { type: "string", minLength: 1, maxLength: 400 },
			type: {
				default: "videos",
				type: "string",
				enum: ["videos", "all", "channels", "playlists", "shorts"],
			},
			features: {
				maxItems: 2,
				type: "array",
				items: { type: "string", enum: ["live", "hd", "4k"] },
			},
			country: {
				default: "us",
				type: "string",
				pattern: "^[A-Za-z]{2}$",
				description: "ISO country code.",
			},
			limit: { default: 20, type: "integer", minimum: 1, maximum: 100 },
		},
		required: ["query"],
		additionalProperties: false,
	},
};

const web = {
	id: "web.search",
	method: "POST",
	path: "/v1/web/search",
	credits: 1,
	keyless: true,
	input: {
		type: "object",
		properties: { query: { type: "string", minLength: 1 } },
		required: ["query"],
	},
};

const maps = {
	id: "zillow.search",
	method: "POST",
	path: "/v1/zillow/search",
	credits: 2,
	keyless: false,
	input: {
		type: "object",
		properties: {
			query: { type: "string", minLength: 1 },
			minPrice: { type: "integer", minimum: 0 },
			maxPrice: { type: "integer", minimum: 0 },
			includePosts: { default: true, type: "boolean" },
		},
		required: ["query"],
	},
};

const ads = {
	id: "ads.search",
	method: "POST",
	path: "/v1/ads/search",
	credits: 2,
	keyless: false,
	input: {
		type: "object",
		properties: {
			query: { type: "string", minLength: 1 },
			network: { type: "string", enum: ["meta", "google", "tiktok"] },
			limit: { type: "integer", minimum: 1, maximum: 100 },
		},
		required: ["network"],
	},
};

const advertisers = {
	id: "ads.advertisers",
	method: "POST",
	path: "/v1/ads/advertisers",
	credits: 2,
	keyless: false,
	input: {
		type: "object",
		properties: {
			query: { type: "string", minLength: 1 },
			network: { type: "string", enum: ["meta", "google", "tiktok"] },
		},
		required: ["query", "network"],
	},
};

test("strips a global refresh flag and finds command flags", () => {
	expect(stripGlobalRefresh(["--refresh", "youtube", "search", "--query", "bun"])).toEqual({
		refresh: true,
		args: ["youtube", "search", "--query", "bun"],
	});
	expect(flagTokens(["youtube", "search", "--query", "bun runtime", "--limit", "2"], ["youtube", "search"])).toEqual([
		"--query",
		"bun runtime",
		"--limit",
		"2",
	]);
});

test("requires fields before the call and rejects unknown flags", () => {
	expect(parseCall([], search.input)).toEqual({
		ok: false,
		message: "Missing required flag --query.",
	});
	const unknown = parseCall(["--query", "bun", "--q", "x"], search.input);
	expect(unknown.ok).toBe(false);
	if (!unknown.ok) {
		expect(unknown.message).toContain("Unknown flag --q.");
		expect(unknown.message).toContain("--query");
		expect(unknown.message).toContain("--limit");
		expect(unknown.message).toContain("--json");
	}
});

test("parses strings, integers, enums, arrays, and output flags", () => {
	const parsed = parseCall(
		["--query", "bun runtime", "--type", "shorts", "--limit", "2", "--features", "live,hd", "--json"],
		search.input,
	);
	expect(parsed).toEqual({
		ok: true,
		call: {
			format: "json",
			body: { query: "bun runtime", type: "shorts", limit: 2, features: ["live", "hd"] },
		},
	});
});

test("rejects bad enums, integers, patterns, and bounds", () => {
	const kind = parseCall(["--query", "bun", "--type", "movie"], search.input);
	expect(kind).toMatchObject({
		ok: false,
		message: "--type must be one of: videos, all, channels, playlists, shorts.",
	});
	expect(parseCall(["--query", "bun", "--limit", "2.5"], search.input)).toMatchObject({
		ok: false,
		message: "--limit must be an integer.",
	});
	expect(parseCall(["--query", "bun", "--country", "Germany"], search.input)).toMatchObject({
		ok: false,
		message: "--country does not match the expected format. ISO country code.",
	});
	expect(parseCall(["--query", "bun", "--features", "live,hd,4k"], search.input)).toMatchObject({
		ok: false,
		message: "--features accepts at most 2 values.",
	});
});

test("builds flat numbers and boolean flags", () => {
	const bad = parseCall(["austin", "--minPrice", "-5"], maps.input);
	expect(bad.ok).toBe(false);

	const ok = parseCall(["austin", "--minPrice", "100", "--maxPrice", "900", "--no-includePosts"], maps.input);
	expect(ok).toEqual({
		ok: true,
		call: { format: "text", body: { query: "austin", minPrice: 100, maxPrice: 900, includePosts: false } },
	});
});

test("a required enum switch is a flag, and the query stays positional", () => {
	expect(parseCall([], ads.input)).toEqual({ ok: false, message: "Missing required flag --network." });
	expect(parseCall(["nike", "--network", "meta", "--limit", "3"], ads.input)).toEqual({
		ok: true,
		call: { format: "text", body: { query: "nike", network: "meta", limit: 3 } },
	});
	expect(parseCall(["--network", "bing"], ads.input)).toMatchObject({
		ok: false,
		message: "--network must be one of: meta, google, tiktok.",
	});
	expect(formatEndpointHelp(ads)).toContain("Usage: stophy ads search [query] [options]");
	expect(parseCall(["nike", "--network", "meta"], advertisers.input)).toEqual({
		ok: true,
		call: { format: "text", body: { query: "nike", network: "meta" } },
	});
	expect(parseCall(["nike"], advertisers.input)).toEqual({ ok: false, message: "Missing required flag --network." });
	expect(formatEndpointHelp(advertisers)).toContain("Usage: stophy ads advertisers <query> [options]");
});

test("a cursor from the server is sent back as given", () => {
	const input = {
		type: "object",
		properties: {
			profile: { type: "string" },
			cursor: { type: "string", minLength: 1 },
		},
		required: ["profile"],
	};
	expect(parseCall(["bun", "--cursor", "sp1.eyJvIjoyfQ"], input)).toEqual({
		ok: true,
		call: { format: "text", body: { profile: "bun", cursor: "sp1.eyJvIjoyfQ" } },
	});
});

test("accepts number enums from anyOf const", () => {
	const parsed = parseCall(["--rankUpTo", "200"], {
		type: "object",
		properties: {
			rankUpTo: {
				anyOf: [
					{ type: "number", const: 100 },
					{ type: "number", const: 200 },
					{ type: "number", const: 500 },
				],
			},
		},
	});
	expect(parsed).toEqual({ ok: true, call: { format: "text", body: { rankUpTo: 200 } } });
	expect(parseCall(["--rankUpTo", "50"], {
		type: "object",
		properties: {
			rankUpTo: {
				anyOf: [
					{ type: "number", const: 100 },
					{ type: "number", const: 200 },
				],
			},
		},
	})).toMatchObject({ ok: false, message: "--rankUpTo must be one of: 100, 200." });
});

test("help reads like a person wrote it: summary, positional input, options, example", () => {
	const help = formatEndpointHelp({
		...search,
		summary: "Search YouTube videos, channels, playlists and shorts",
		example: { query: "bun runtime", limit: 5 },
	});
	expect(help).toContain("Usage: stophy youtube search <query> [options]");
	expect(help).toContain("Search YouTube videos, channels, playlists and shorts.");
	expect(help).toMatch(/--type <type> +videos, all, channels, playlists or shorts \(default: videos\)/u);
	expect(help).toMatch(/--features <list> +Comma-separated: live, hd, 4k/u);
	expect(help).toMatch(/--limit <number> +Number of results \(default: 20, max: 100\)/u);
	expect(help).toContain('stophy youtube search "bun runtime" --limit 5');
	expect(help).toContain("--json");
	expect(help).toMatch(/--raw +Output the full response with its request id/u);
	for (const internal of ["youtube.search", "credit", "cached", "3600", "characters", "endpoint"]) {
		expect(help).not.toContain(internal);
	}
	expect(formatDescribe(search)).toContain("youtube.search");
	expect(formatDescribe(search)).toContain("Cost: 1 credit per call.");
});

test("the one required text field can be given without its flag", () => {
	expect(parseCall(["bun runtime", "--limit", "5"], search.input)).toMatchObject({
		ok: true,
		call: { body: { query: "bun runtime", limit: 5 } },
	});
	expect(parseCall(["--query", "bun"], search.input)).toMatchObject({
		ok: true,
		call: { body: { query: "bun" } },
	});
	expect(parseCall(["bun", "--query", "deno"], search.input)).toMatchObject({
		ok: false,
		message: "Flag --query was given twice.",
	});
	expect(parseCall(["bun", "extra"], search.input)).toMatchObject({
		ok: false,
		message: "Unexpected argument `extra`.",
	});
});

test("endpoint index filters and marks keyless calls free", () => {
	const text = formatEndpointIndex([web, maps], "web");
	expect(text).toContain("web.search");
	expect(text).toContain("free");
	expect(text).not.toContain("zillow.search");
	expect(formatEndpointIndex([maps], "zillow")).not.toContain("free");
	expect(formatEndpointIndex([search], "nope")).toBe("No endpoints match `nope`.");
});
