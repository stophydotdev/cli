import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import { request } from "./client.js";
import { getConfigPath } from "./config.js";
import { CliError } from "./errors.js";

const CATALOG_TTL_MS = 5 * 60 * 1000;

export const endpointSchema = z.object({
	id: z.string().min(1),
	summary: z.string().min(1).optional(),
	method: z.literal("POST"),
	path: z.string().min(1),
	credits: z.number().int().nonnegative(),
	keyless: z.boolean(),
	perItems: z.number().int().positive().nullable(),
	cacheTtlSeconds: z.number().int().nonnegative(),
	input: z.record(z.string(), z.unknown()),
	example: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CatalogEndpoint = z.infer<typeof endpointSchema>;

const sourceSchema = z.object({
	id: z.string().min(1),
	summary: z.string().min(1),
});

export type CatalogSource = z.infer<typeof sourceSchema>;

export interface Catalog {
	readonly endpoints: readonly CatalogEndpoint[];
	readonly sources: readonly CatalogSource[];
}

const catalogResponseSchema = z.object({
	endpoints: z.array(endpointSchema),
	sources: z.array(sourceSchema).optional(),
});

const storedSchema = z.object({
	fetchedAt: z.string().min(1),
	endpoints: z.array(endpointSchema),
	sources: z.array(sourceSchema).optional(),
});

interface StoredCatalog extends Catalog {
	readonly fetchedAt: number;
}

export type CatalogPlan = "fetch" | "fresh" | "stale";

/** Decide whether a cached catalog is fresh, stale, or missing. */
export function planCatalog(input: {
	readonly fetchedAt: number | undefined;
	readonly now: number;
	readonly force: boolean;
}): CatalogPlan {
	if (input.force || input.fetchedAt === undefined) return "fetch";
	if (input.now - input.fetchedAt < CATALOG_TTL_MS) return "fresh";
	return "stale";
}

export function catalogFilePath(): string {
	return join(dirname(getConfigPath()), "catalog.json");
}

/** Load `GET /v1/endpoints`, using a 5 minute cache and a background refresh when it is older. */
export async function loadCatalog(options: {
	readonly file: string;
	readonly now: number;
	readonly force: boolean;
	readonly fetch: () => Promise<Catalog>;
	readonly warn: (message: string) => void;
}): Promise<Catalog & { background?: Promise<void> }> {
	const cached = await readStored(options.file);
	const plan = planCatalog({
		fetchedAt: cached?.fetchedAt,
		now: options.now,
		force: options.force,
	});
	if (plan === "fresh" && cached) return catalogOf(cached);
	if (plan === "stale" && cached) {
		return {
			...catalogOf(cached),
			background: refresh(options, cached.fetchedAt),
		};
	}
	try {
		const catalog = await options.fetch();
		assertCatalog(catalog.endpoints);
		await writeStored(options.file, catalog);
		return catalog;
	} catch (error) {
		if (!options.force && cached) {
			options.warn(staleWarning(error, cached.fetchedAt));
			return catalogOf(cached);
		}
		if (error instanceof CliError) throw error;
		const reason = error instanceof Error ? error.message : "network error";
		throw new CliError(`Could not load the endpoint catalog: ${reason}`);
	}
}

function catalogOf(stored: StoredCatalog): Catalog {
	return { endpoints: stored.endpoints, sources: stored.sources };
}

export async function fetchCatalog(): Promise<Catalog> {
	const response = await request({
		method: "GET",
		path: "/v1/endpoints",
		accept: "application/json",
	});
	const parsed = catalogResponseSchema.safeParse(response.json);
	if (!parsed.success)
		throw new CliError("Server returned an unexpected endpoint catalog.");
	assertCatalog(parsed.data.endpoints);
	return {
		endpoints: parsed.data.endpoints,
		sources: parsed.data.sources ?? [],
	};
}

function refresh(
	options: {
		readonly file: string;
		readonly fetch: () => Promise<Catalog>;
		readonly warn: (message: string) => void;
	},
	fetchedAt: number,
): Promise<void> {
	return options
		.fetch()
		.then(async (catalog) => {
			assertCatalog(catalog.endpoints);
			await writeStored(options.file, catalog);
		})
		.catch((error: unknown) => {
			options.warn(staleWarning(error, fetchedAt));
		});
}

function staleWarning(error: unknown, fetchedAt: number): string {
	const reason = error instanceof Error ? error.message : "network error";
	return `Could not refresh the endpoint catalog (${reason}). Using the cached catalog from ${new Date(fetchedAt).toISOString()}.`;
}

function assertCatalog(endpoints: readonly CatalogEndpoint[]): void {
	const seen = new Set<string>();
	for (const endpoint of endpoints) {
		if (seen.has(endpoint.id)) {
			throw new CliError(`Endpoint catalog lists \`${endpoint.id}\` twice.`);
		}
		if (endpoint.id.split(".").some((part) => part.length === 0)) {
			throw new CliError(`Endpoint id \`${endpoint.id}\` is invalid.`);
		}
		seen.add(endpoint.id);
	}
}

async function readStored(file: string): Promise<StoredCatalog | undefined> {
	let text: string;
	try {
		text = await readFile(file, "utf8");
	} catch {
		return undefined;
	}
	let json: unknown;
	try {
		json = parseJson(text);
	} catch {
		return undefined;
	}
	const parsed = storedSchema.safeParse(json);
	if (!parsed.success) return undefined;
	const fetchedAt = Date.parse(parsed.data.fetchedAt);
	if (Number.isNaN(fetchedAt)) return undefined;
	try {
		assertCatalog(parsed.data.endpoints);
	} catch {
		return undefined;
	}
	return {
		fetchedAt,
		endpoints: parsed.data.endpoints,
		sources: parsed.data.sources ?? [],
	};
}

async function writeStored(file: string, catalog: Catalog): Promise<void> {
	await mkdir(dirname(file), { recursive: true });
	const payload = `${JSON.stringify({ fetchedAt: new Date().toISOString(), endpoints: catalog.endpoints, sources: catalog.sources }, null, 2)}\n`;
	const temporary = `${file}.${process.pid}.tmp`;
	await writeFile(temporary, payload, "utf8");
	await rename(temporary, file);
}

function parseJson(text: string): unknown {
	return JSON.parse(text);
}
