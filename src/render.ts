const TITLE_KEYS = [
	"title",
	"name",
	"headline",
	"keyword",
	"phrase",
	"query",
	"text",
	"username",
];
const OWNER_KEYS = [
	"channelName",
	"authorName",
	"pageName",
	"advertiserName",
	"sellerName",
	"brandName",
];
const URL_KEYS = ["url", "videoUrl", "postUrl", "placeUrl", "link"];
const SKIPPED_URL = /thumbnail|avatar|image|photo|icon|logo/iu;

type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(row: Row, keys: readonly string[]): string | undefined {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === "string" && value.length > 0) return value;
	}
	return undefined;
}

function urlOf(row: Row): string | undefined {
	const named = firstString(row, URL_KEYS);
	if (named) return named;
	for (const [key, value] of Object.entries(row)) {
		if (
			key.endsWith("Url") &&
			!SKIPPED_URL.test(key) &&
			typeof value === "string" &&
			value.length > 0
		) {
			return value;
		}
	}
	return undefined;
}

function oneLine(text: string, max = 140): string {
	const flat = text.replace(/\s+/gu, " ").trim();
	return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function scalar(value: unknown): string {
	if (Array.isArray(value)) return value.map(scalar).join(", ");
	if (typeof value === "object" && value !== null) return JSON.stringify(value);
	return String(value);
}

/** One list item as a numbered title line, plus its link, for people skimming a terminal. */
function renderRow(item: unknown, index: number): string {
	const prefix = `${index + 1}. `;
	if (!isRow(item)) return `${prefix}${oneLine(scalar(item))}`;
	const title = firstString(item, TITLE_KEYS);
	const owner = firstString(item, OWNER_KEYS);
	const url = urlOf(item);
	if (!title && !url) return `${prefix}${oneLine(JSON.stringify(item), 200)}`;
	const head = [title ? oneLine(title) : url, owner]
		.filter((part) => part !== undefined)
		.join(" - ");
	return [`${prefix}${head}`, ...(title && url ? [`   ${url}`] : [])].join(
		"\n",
	);
}

/** Readable text for a response's `data`: list endpoints as rows, everything else as `key: value` lines. */
export function renderData(data: unknown): string {
	if (!isRow(data)) return data === undefined ? "" : scalar(data);
	const lines: string[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (value === null || value === undefined) continue;
		if (Array.isArray(value) && value.length === 0) continue;
		if (
			Array.isArray(value) &&
			value.some((item) => typeof item === "object")
		) {
			if (key !== "results") lines.push(`${key}:`);
			lines.push(...value.map(renderRow));
			continue;
		}
		lines.push(`${key}: ${scalar(value)}`);
	}
	const results = data.results;
	if (Array.isArray(results) && results.length === 0) {
		lines.unshift("No results.");
	}
	return lines.join("\n");
}
