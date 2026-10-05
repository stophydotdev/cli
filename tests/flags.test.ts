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
			page: { default: 1, type: "integer", minimum: 1, maximum: 100, description: "Page number, starting at 1." },
		},
		required: ["query"],
		additionalProperties: false,
	},
};

const web = {
	id: "google.search",
	method: "POST",
	path: "/v1/google/search",
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
			keywords: { type: "string", minLength: 1 },
			minPrice: { type: "integer", minimum: 0 },
			maxPrice: { type: "integer", minimum: 0 },
			includePosts: { default: true, type: "boolean" },
		},
		required: ["keywords"],
	},
};

const video = {
	id: "youtube.video",
	method: "POST",
	path: "/v1/youtube/video",
	credits: 1,
	keyless: true,
	example: { videoId: "p0fybvFyOlM" },
	input: {
		type: "object",
		properties: {
			videoUrl: { type: "string", description: "Link to the YouTube video, like https://youtu.be/p0fybvFyOlM. Send this or videoId." },
			videoId: { type: "string", description: "YouTube video id, like p0fybvFyOlM. Send this or videoUrl." },
		},
		sendOne: ["videoUrl", "videoId"],
		additionalProperties: false,
	},
};

const profile = {
	id: "tiktok.profile",
	method: "POST",
	path: "/v1/tiktok/profile",
	credits: 1,
	keyless: false,
	input: {
		type: "object",
		properties: {
			userUrl: { type: "string" },
			username: { type: "string" },
			cursor: { type: "string", minLength: 1 },
		},
		sendOne: ["userUrl", "username"],
		additionalProperties: false,
	},
};

const posts = {
	id: "linkedin.posts",
	method: "POST",
	path: "/v1/linkedin/posts",
	credits: 1,
	keyless: false,
	input: {
		type: "object",
		properties: {
			profileUrl: { type: "string" },
			profileId: { type: "string" },
			companyUrl: { type: "string" },
			companyId: { type: "string" },
		},
		sendOne: ["profileUrl", "profileId", "companyUrl", "companyId"],
		additionalProperties: false,
	},
};

test("strips a global refresh flag and finds command flags", () => {
	expect(stripGlobalRefresh(["--refresh", "youtube", "search", "--query", "bun"])).toEqual({
		refresh: true,
		args: ["youtube", "search", "--query", "bun"],
	});
	expect(flagTokens(["youtube", "search", "--query", "bun runtime", "--page", "2"], ["youtube", "search"])).toEqual([
		"--query",
		"bun runtime",
		"--page",
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
		expect(unknown.message).toContain("--page");
		expect(unknown.message).toContain("--json");
	}
});

test("parses strings, integers, enums, arrays, and output flags", () => {
	const parsed = parseCall(
		["--query", "bun runtime", "--type", "shorts", "--page", "2", "--features", "live,hd", "--json"],
		search.input,
	);
	expect(parsed).toEqual({
		ok: true,
		call: {
			format: "json",
			body: { query: "bun runtime", type: "shorts", page: 2, features: ["live", "hd"] },
		},
	});
});

test("rejects bad enums, integers, patterns, and bounds", () => {
	const kind = parseCall(["--query", "bun", "--type", "movie"], search.input);
	expect(kind).toMatchObject({
		ok: false,
		message: "--type must be one of: videos, all, channels, playlists, shorts.",
	});
	expect(parseCall(["--query", "bun", "--page", "2.5"], search.input)).toMatchObject({
		ok: false,
		message: "--page must be an integer.",
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
		call: { format: "text", body: { keywords: "austin", minPrice: 100, maxPrice: 900, includePosts: false } },
	});
});

test("a link or an id goes to the field that fits, and exactly one is sent", () => {
	expect(parseCall(["https://youtu.be/p0fybvFyOlM"], video.input)).toEqual({
		ok: true,
		call: { format: "text", body: { videoUrl: "https://youtu.be/p0fybvFyOlM" } },
	});
	expect(parseCall(["p0fybvFyOlM"], video.input)).toEqual({
		ok: true,
		call: { format: "text", body: { videoId: "p0fybvFyOlM" } },
	});
	expect(parseCall(["--videoId", "p0fybvFyOlM"], video.input)).toMatchObject({ ok: true });
	expect(parseCall([], video.input)).toEqual({ ok: false, message: "Send --videoUrl or --videoId." });
	expect(parseCall(["p0fybvFyOlM", "--videoUrl", "https://youtu.be/p0fybvFyOlM"], video.input)).toEqual({
		ok: false,
		message: "Send only one of --videoUrl or --videoId.",
	});
	expect(parseCall(["p0fybvFyOlM", "https://youtu.be/p0fybvFyOlM"], video.input)).toEqual({
		ok: false,
		message: "Unexpected argument `https://youtu.be/p0fybvFyOlM`.",
	});
	expect(parseCall(["--videoId", "a", "--videoUrl", "https://youtu.be/b"], video.input)).toEqual({
		ok: false,
		message: "Send only one of --videoUrl or --videoId.",
	});
	expect(parseCall(["tiktok", "--cursor", "c1"], profile.input)).toEqual({
		ok: true,
		call: { format: "text", body: { username: "tiktok", cursor: "c1" } },
	});
	expect(parseCall(["satyanadella"], posts.input)).toMatchObject({ ok: false, message: "Unexpected argument `satyanadella`." });
	expect(parseCall([], posts.input)).toEqual({
		ok: false,
		message: "Send --profileUrl, --profileId, --companyUrl or --companyId.",
	});
	expect(parseCall(["--companyId", "microsoft"], posts.input)).toMatchObject({ ok: true });
	const help = formatEndpointHelp(video);
	expect(help).toContain("Usage: stophy youtube video <link-or-id> [options]");
	expect(help).toMatch(/--videoId <video-id> +YouTube video id, like p0fybvFyOlM \(send one\)/u);
	expect(help).toContain("stophy youtube video p0fybvFyOlM");
});

test("limit is not a flag", () => {
	const parsed = parseCall(["--query", "bun", "--limit", "5"], search.input);
	expect(parsed.ok).toBe(false);
	if (!parsed.ok) expect(parsed.message).toContain("Unknown flag --limit.");
});

test("a cursor from the server is sent back as given", () => {
	const input = {
		type: "object",
		properties: {
			username: { type: "string" },
			cursor: { type: "string", minLength: 1 },
		},
		required: ["username"],
	};
	expect(parseCall(["bun", "--cursor", "EpcDEgNidW4"], input)).toEqual({
		ok: true,
		call: { format: "text", body: { username: "bun", cursor: "EpcDEgNidW4" } },
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
		example: { query: "bun runtime", page: 2 },
	});
	expect(help).toContain("Usage: stophy youtube search <query> [options]");
	expect(help).toContain("Search YouTube videos, channels, playlists and shorts.");
	expect(help).toMatch(/--type <type> +videos, all, channels, playlists or shorts \(default: videos\)/u);
	expect(help).toMatch(/--features <list> +Comma-separated: live, hd, 4k/u);
	expect(help).toMatch(/--page <number> +Page number, starting at 1 \(default: 1, max: 100\)/u);
	expect(help).toContain('stophy youtube search "bun runtime" --page 2');
	expect(help).toContain("--json");
	expect(help).toMatch(/--raw +Output the full response with its request id/u);
	for (const internal of ["youtube.search", "credit", "cached", "3600", "characters", "endpoint"]) {
		expect(help).not.toContain(internal);
	}
	expect(formatDescribe(search)).toContain("youtube.search");
	expect(formatDescribe(search)).toContain("Cost: 1 credit per call.");
});

test("the one required text field can be given without its flag", () => {
	expect(parseCall(["bun runtime", "--page", "5"], search.input)).toMatchObject({
		ok: true,
		call: { body: { query: "bun runtime", page: 5 } },
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
	const text = formatEndpointIndex([web, maps], "google");
	expect(text).toContain("google.search");
	expect(text).toContain("free");
	expect(text).not.toContain("zillow.search");
	expect(formatEndpointIndex([maps], "zillow")).not.toContain("free");
	expect(formatEndpointIndex([search], "nope")).toBe("No endpoints match `nope`.");
});

const transcript = {
	id: "instagram.transcript",
	method: "POST",
	path: "/v1/instagram/transcript",
	credits: 1,
	pricing: "1 credit when the video has captions; otherwise 2 credits plus 1 credit for every 10 seconds of audio, up to 30 minutes",
	keyless: false,
	input: {
		type: "object",
		properties: { postUrl: { type: "string" }, postCode: { type: "string" } },
		sendOne: ["postUrl", "postCode"],
	},
};

test("a price that is not flat shows its terms, not one number", () => {
	expect(formatDescribe(transcript)).toContain(
		"Cost: 1 credit when the video has captions; otherwise 2 credits plus 1 credit for every 10 seconds of audio, up to 30 minutes.",
	);
	expect(formatDescribe(transcript)).not.toContain("per call");
	const list = formatEndpointIndex([search, transcript]);
	expect(list).toMatch(/^instagram\.transcript +from 1 credit$/mu);
	expect(list).toMatch(/^youtube\.search +1 credit +$/mu);
});
