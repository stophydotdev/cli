import type { CatalogEndpoint } from "./catalog.js";
import { CliError } from "./errors.js";

interface StringSchema {
	readonly type: "string";
	readonly enumValues?: readonly string[];
	readonly minLength?: number;
	readonly maxLength?: number;
	readonly patterns?: readonly string[];
	readonly format?: string;
	readonly description?: string;
	readonly defaultLabel?: string;
}

interface NumberSchema {
	readonly type: "number";
	readonly integer: boolean;
	readonly enumValues?: readonly number[];
	readonly minimum?: number;
	readonly maximum?: number;
	readonly exclusiveMinimum?: number;
	readonly exclusiveMaximum?: number;
	readonly description?: string;
	readonly defaultLabel?: string;
}

interface BooleanSchema {
	readonly type: "boolean";
	readonly description?: string;
	readonly defaultLabel?: string;
}

interface ArraySchema {
	readonly type: "array";
	readonly item: StringSchema | NumberSchema | BooleanSchema;
	readonly minItems?: number;
	readonly maxItems?: number;
	readonly description?: string;
}

interface JsonSchema {
	readonly type: "json";
	readonly description?: string;
}

interface ObjectSchema {
	readonly type: "object";
	readonly fields: readonly ObjectField[];
	readonly description?: string;
}

interface ObjectField {
	readonly name: string;
	readonly required: boolean;
	readonly schema: ValueSchema;
}

type ValueSchema =
	| StringSchema
	| NumberSchema
	| BooleanSchema
	| ArraySchema
	| JsonSchema
	| ObjectSchema;

interface SlotBase {
	readonly flag: string;
	readonly always: boolean;
	readonly whenGroup?: string;
	readonly sendOne?: boolean;
	readonly description?: string;
	readonly defaultLabel?: string;
}

type StringSlot = SlotBase & {
	readonly kind: "string";
	readonly enumValues?: readonly string[];
	readonly minLength?: number;
	readonly maxLength?: number;
	readonly patterns?: readonly string[];
	readonly format?: string;
};

type NumberSlot = SlotBase & {
	readonly kind: "integer" | "number";
	readonly enumValues?: readonly number[];
	readonly minimum?: number;
	readonly maximum?: number;
	readonly exclusiveMinimum?: number;
	readonly exclusiveMaximum?: number;
};

type BooleanSlot = SlotBase & { readonly kind: "boolean" };

type JsonSlot = SlotBase & { readonly kind: "json" };

type ScalarSlot = StringSlot | NumberSlot | BooleanSlot;

type ArraySlot = SlotBase & {
	readonly kind: "array";
	readonly item: ScalarSlot;
	readonly minItems?: number;
	readonly maxItems?: number;
};

type Slot = ScalarSlot | ArraySlot | JsonSlot;

export interface ParsedCall {
	readonly body: Record<string, unknown>;
	readonly format: "text" | "json" | "raw";
	readonly outputFile?: string;
}

export type ParseResult =
	| { readonly ok: true; readonly call: ParsedCall }
	| { readonly ok: false; readonly message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value)
		? value
		: undefined;
}

function readStringList(value: unknown): readonly string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const items: string[] = [];
	for (const item of value) {
		if (typeof item !== "string") return undefined;
		items.push(item);
	}
	return items;
}

function readNumberList(value: unknown): readonly number[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const items: number[] = [];
	for (const item of value) {
		const number = readNumber(item);
		if (number === undefined) return undefined;
		items.push(number);
	}
	return items;
}

function isNullSchema(value: unknown): boolean {
	return isRecord(value) && value.type === "null";
}

function readStringSchema(
	value: Record<string, unknown>,
	description: string | undefined,
): StringSchema {
	const constant = readString(value.const);
	const pattern = readString(value.pattern);
	const fallback = readString(value.default);
	return {
		type: "string",
		enumValues:
			constant !== undefined ? [constant] : readStringList(value.enum),
		minLength: readNumber(value.minLength),
		maxLength: readNumber(value.maxLength),
		patterns: pattern !== undefined ? [pattern] : undefined,
		format: readString(value.format),
		description,
		defaultLabel: fallback,
	};
}

function readNumberSchema(
	value: Record<string, unknown>,
	integer: boolean,
	description: string | undefined,
): NumberSchema {
	const constant = readNumber(value.const);
	const fallback = readNumber(value.default);
	return {
		type: "number",
		integer,
		enumValues:
			constant !== undefined ? [constant] : readNumberList(value.enum),
		minimum: readNumber(value.minimum),
		maximum: readNumber(value.maximum),
		exclusiveMinimum: readNumber(value.exclusiveMinimum),
		exclusiveMaximum: readNumber(value.exclusiveMaximum),
		description,
		defaultLabel: fallback === undefined ? undefined : String(fallback),
	};
}

function readSchema(value: unknown): ValueSchema | undefined {
	if (!isRecord(value)) return undefined;
	const description = readString(value.description);
	if (Array.isArray(value.anyOf)) return readUnion(value.anyOf, description);
	if (value.type === "object" && isRecord(value.properties)) {
		return readObject(value, description);
	}
	if (value.type === "array") return readArray(value, description);
	if (value.type === "boolean") {
		const fallback = value.default;
		return {
			type: "boolean",
			description,
			defaultLabel:
				typeof fallback === "boolean" ? String(fallback) : undefined,
		};
	}
	if (value.type === "integer")
		return readNumberSchema(value, true, description);
	if (value.type === "number")
		return readNumberSchema(value, false, description);
	if (value.type === "string") return readStringSchema(value, description);
	if (readStringList(value.enum)) return readStringSchema(value, description);
	return undefined;
}

function readObject(
	value: Record<string, unknown>,
	description: string | undefined,
): ObjectSchema {
	const properties = value.properties;
	const required = new Set(readStringList(value.required) ?? []);
	const fields: ObjectField[] = [];
	if (isRecord(properties)) {
		for (const [name, property] of Object.entries(properties)) {
			fields.push({
				name,
				required: required.has(name),
				schema: readSchema(property) ?? {
					type: "json",
					description: undefined,
				},
			});
		}
	}
	return { type: "object", fields, description };
}

function readArray(
	value: Record<string, unknown>,
	description: string | undefined,
): ValueSchema {
	const item = readSchema(value.items);
	if (
		item === undefined ||
		item.type === "array" ||
		item.type === "object" ||
		item.type === "json"
	) {
		return { type: "json", description };
	}
	return {
		type: "array",
		item,
		minItems: readNumber(value.minItems),
		maxItems: readNumber(value.maxItems),
		description,
	};
}

function readUnion(
	branches: readonly unknown[],
	description: string | undefined,
): ValueSchema {
	const parsed: ValueSchema[] = [];
	for (const branch of branches) {
		if (isNullSchema(branch)) continue;
		const schema = readSchema(branch);
		if (schema === undefined) return { type: "json", description };
		parsed.push(schema);
	}
	if (parsed.length === 1) {
		const [only] = parsed;
		if (only) return mergeDescription(only, description);
	}
	if (parsed.length > 1 && parsed.every(isStringSchema)) {
		const patterns = parsed.flatMap((schema) => schema.patterns ?? []);
		const formats: string[] = [];
		for (const schema of parsed) {
			if (schema.format && !formats.includes(schema.format))
				formats.push(schema.format);
		}
		return {
			type: "string",
			patterns: patterns.length > 0 ? patterns : undefined,
			format: formats.length > 0 ? formats.join(" or ") : undefined,
			description,
		};
	}
	if (parsed.length > 1 && parsed.every(isNumberSchema)) {
		const enumValues = parsed.flatMap((schema) => schema.enumValues ?? []);
		if (enumValues.length === parsed.length) {
			return {
				type: "number",
				integer: parsed.every((schema) => schema.integer),
				enumValues,
				description,
			};
		}
	}
	return { type: "json", description };
}

function isStringSchema(schema: ValueSchema): schema is StringSchema {
	return schema.type === "string";
}

function isNumberSchema(schema: ValueSchema): schema is NumberSchema {
	return schema.type === "number";
}

function mergeDescription(
	schema: ValueSchema,
	description: string | undefined,
): ValueSchema {
	if (schema.description || description === undefined) return schema;
	return { ...schema, description };
}

/** Flatten an endpoint input schema into the flags the CLI accepts. */
export function slotsFromInput(input: unknown): Slot[] {
	const schema = readSchema(input);
	if (schema === undefined || schema.type !== "object") {
		throw new CliError("Endpoint input schema is not an object.");
	}
	const group = new Set(sendOneOf(input));
	return schema.fields
		.flatMap((field) =>
			flatten(field.schema, [field.name], field.required, true, undefined),
		)
		.map((slot) => (group.has(slot.flag) ? { ...slot, sendOne: true } : slot));
}

/** The fields of which exactly one must be sent, such as `videoUrl` and `videoId`. */
function sendOneOf(input: unknown): readonly string[] {
	return isRecord(input) ? (readStringList(input.sendOne) ?? []) : [];
}

/** A `[xUrl, xId]` pair can be given as one bare argument: a link goes to the first field, anything else to the second. */
function linkOrId(input: unknown): readonly [string, string] | undefined {
	const [link, id, ...rest] = sendOneOf(input);
	if (link === undefined || id === undefined || rest.length > 0)
		return undefined;
	return link.endsWith("Url") ? [link, id] : undefined;
}

function sendOneMessage(
	group: readonly string[],
	setFlags: ReadonlySet<string>,
): string | undefined {
	if (group.length === 0) return undefined;
	const given = group.filter((flag) => setFlags.has(flag)).length;
	if (given === 1) return undefined;
	const names = group.map((flag) => `--${flag}`);
	const list = `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
	return given === 0 ? `Send ${list}.` : `Send only one of ${list}.`;
}

function flatten(
	schema: ValueSchema,
	path: readonly string[],
	required: boolean,
	ancestorRequired: boolean,
	optionalGroup: string | undefined,
): Slot[] {
	if (schema.type === "object") {
		const nextAncestor = ancestorRequired && required;
		const nextGroup = required ? optionalGroup : path.join(".");
		return schema.fields.flatMap((field) =>
			flatten(
				field.schema,
				[...path, field.name],
				field.required,
				nextAncestor,
				nextGroup,
			),
		);
	}
	const flag = path.join(".");
	const always = ancestorRequired && required;
	const whenGroup = !always && required ? optionalGroup : undefined;
	const base = {
		flag,
		always,
		whenGroup,
		description: schema.description,
	};
	if (schema.type === "array") {
		return [
			{
				...base,
				kind: "array",
				item: scalarSlot(schema.item, flag),
				minItems: schema.minItems,
				maxItems: schema.maxItems,
			},
		];
	}
	if (schema.type === "json") return [{ ...base, kind: "json" }];
	if (schema.type === "boolean") {
		return [{ ...base, kind: "boolean", defaultLabel: schema.defaultLabel }];
	}
	if (schema.type === "string") {
		return [
			{
				...base,
				kind: "string",
				enumValues: schema.enumValues,
				minLength: schema.minLength,
				maxLength: schema.maxLength,
				patterns: schema.patterns,
				format: schema.format,
				defaultLabel: schema.defaultLabel,
			},
		];
	}
	return [
		{
			...base,
			kind: schema.integer ? "integer" : "number",
			enumValues: schema.enumValues,
			minimum: schema.minimum,
			maximum: schema.maximum,
			exclusiveMinimum: schema.exclusiveMinimum,
			exclusiveMaximum: schema.exclusiveMaximum,
			defaultLabel: schema.defaultLabel,
		},
	];
}

function scalarSlot(
	schema: StringSchema | NumberSchema | BooleanSchema,
	flag: string,
): ScalarSlot {
	const [slot] = flatten(schema, [flag], false, false, undefined);
	if (slot === undefined || slot.kind === "array" || slot.kind === "json") {
		throw new CliError(`Could not read the items for --${flag}.`);
	}
	return slot;
}

function fail(message: string): {
	readonly ok: false;
	readonly message: string;
} {
	return { ok: false, message };
}

function knownFlags(slots: readonly Slot[]): string {
	return [
		...slots.map((slot) => `--${slot.flag}`),
		"--json",
		"--raw",
		"--output",
	].join(", ");
}

/** Parse endpoint flags into a JSON body. Required fields are checked before the call. */
export function parseCall(
	tokens: readonly string[],
	input: unknown,
): ParseResult {
	const slots = slotsFromInput(input);
	const byFlag = new Map(slots.map((slot) => [slot.flag, slot]));
	const positional = positionalSlot(slots);
	const pair = positional === undefined ? linkOrId(input) : undefined;
	const body: Record<string, unknown> = {};
	const setFlags = new Set<string>();
	let format: ParsedCall["format"] = "text";
	let outputFile: string | undefined;
	let sawJson = false;
	let sawRaw = false;

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (token === undefined) continue;
		if (token === "--") {
			const extra = tokens[index + 1];
			if (extra !== undefined) return fail(`Unexpected argument \`${extra}\`.`);
			break;
		}
		if (!token.startsWith("-")) {
			const target =
				positional ??
				(pair === undefined
					? undefined
					: byFlag.get(/^https?:\/\//iu.test(token) ? pair[0] : pair[1]));
			const taken =
				target !== undefined &&
				(pair === undefined
					? setFlags.has(target.flag)
					: pair.some((flag) => setFlags.has(flag)));
			if (target === undefined || taken)
				return fail(`Unexpected argument \`${token}\`.`);
			const value = readFlag(target, token, false, true);
			if (!value.ok) return value;
			setValue(body, target.flag, value.value);
			setFlags.add(target.flag);
			continue;
		}
		if (token === "--json") {
			if (sawJson) return fail("Flag --json was given twice.");
			sawJson = true;
			continue;
		}
		if (token === "--raw") {
			if (sawRaw) return fail("Flag --raw was given twice.");
			sawRaw = true;
			continue;
		}
		const output = takeOutput(token, tokens[index + 1], outputFile);
		if (output.kind === "error") return fail(output.message);
		if (output.kind === "set") {
			outputFile = output.value;
			if (output.consumed) index += 1;
			continue;
		}

		const matched = matchFlag(token, byFlag);
		if (matched.kind === "error") return fail(matched.message);
		if (matched.kind === "unknown") {
			return fail(
				`Unknown flag ${matched.token}. Flags: ${knownFlags(slots)}.`,
			);
		}
		const slot = matched.slot;
		if (slot.kind !== "array" && setFlags.has(slot.flag)) {
			return fail(`Flag --${slot.flag} was given twice.`);
		}
		const raw =
			matched.inline ?? (matched.negate ? undefined : tokens[index + 1]);
		const parsed = readFlag(
			slot,
			raw,
			matched.negate,
			matched.inline !== undefined,
		);
		if (!parsed.ok) return parsed;
		if (parsed.consumed) index += 1;
		if (slot.kind === "array") {
			const items = parsed.value;
			if (!Array.isArray(items)) return fail(`--${slot.flag} must be a list.`);
			for (const item of items) appendValue(body, slot.flag, item);
		} else {
			setValue(body, slot.flag, parsed.value);
		}
		setFlags.add(slot.flag);
	}

	if (sawJson && sawRaw) return fail("Use either --json or --raw.");
	if (sawJson) format = "json";
	else if (sawRaw) format = "raw";

	const missing = missingFlags(slots, setFlags);
	if (missing.length > 0) return fail(missingMessage(missing));
	const sendOne = sendOneMessage(sendOneOf(input), setFlags);
	if (sendOne) return fail(sendOne);
	const bounds = boundsMessage(slots, body);
	if (bounds) return fail(bounds);
	return {
		ok: true,
		call: {
			body,
			format,
			...(outputFile === undefined ? {} : { outputFile }),
		},
	};
}

function takeOutput(
	token: string,
	next: string | undefined,
	current: string | undefined,
):
	| { readonly kind: "skip" }
	| { readonly kind: "error"; readonly message: string }
	| {
			readonly kind: "set";
			readonly value: string;
			readonly consumed: boolean;
	  } {
	const inline = token.startsWith("--output=")
		? token.slice("--output=".length)
		: undefined;
	if (token !== "--output" && token !== "-o" && inline === undefined) {
		return { kind: "skip" };
	}
	if (current !== undefined)
		return { kind: "error", message: "Flag --output was given twice." };
	const value = inline ?? next;
	if (value === undefined || (inline === undefined && value.startsWith("-"))) {
		return { kind: "error", message: "Missing value for --output." };
	}
	if (value.length === 0)
		return { kind: "error", message: "Missing value for --output." };
	return { kind: "set", value, consumed: inline === undefined };
}

function matchFlag(
	token: string,
	byFlag: ReadonlyMap<string, Slot>,
):
	| { readonly kind: "unknown"; readonly token: string }
	| { readonly kind: "error"; readonly message: string }
	| {
			readonly kind: "match";
			readonly slot: Slot;
			readonly inline?: string;
			readonly negate: boolean;
	  } {
	if (token.startsWith("--no-")) {
		const name = token.slice("--no-".length);
		const slot = byFlag.get(name);
		if (slot === undefined || slot.kind !== "boolean") {
			return { kind: "unknown", token };
		}
		if (token.includes("=")) {
			return { kind: "error", message: `--no-${name} does not take a value.` };
		}
		return { kind: "match", slot, negate: true };
	}
	const equals = token.indexOf("=");
	const name = (equals === -1 ? token : token.slice(0, equals)).replace(
		/^--/u,
		"",
	);
	const inline = equals === -1 ? undefined : token.slice(equals + 1);
	const slot = byFlag.get(name);
	if (!token.startsWith("--") || slot === undefined)
		return { kind: "unknown", token };
	return { kind: "match", slot, inline, negate: false };
}

interface ReadFlag {
	readonly ok: true;
	readonly value: unknown;
	readonly consumed: boolean;
}

function readFlag(
	slot: Slot,
	raw: string | undefined,
	negate: boolean,
	inline: boolean,
): ReadFlag | { readonly ok: false; readonly message: string } {
	if (slot.kind === "boolean" && negate)
		return { ok: true, value: false, consumed: false };
	if (
		slot.kind === "boolean" &&
		!inline &&
		(raw === undefined || isFlagToken(raw))
	) {
		return { ok: true, value: true, consumed: false };
	}
	if (raw === undefined || (!inline && isFlagToken(raw))) {
		return fail(`Missing value for --${slot.flag}.`);
	}
	if (slot.kind === "array") {
		const parts = splitList(raw);
		if (parts.length === 0) return fail(`--${slot.flag} has an empty item.`);
		const values: unknown[] = [];
		for (const part of parts) {
			const item = readScalar(slot.item, part);
			if (!item.ok) return item;
			values.push(item.value);
		}
		return { ok: true, value: values, consumed: !inline };
	}
	if (slot.kind === "json") {
		const value = readJson(raw, slot.flag);
		if (!value.ok) return value;
		return { ok: true, value: value.value, consumed: !inline };
	}
	const scalar = readScalar(slot, raw);
	if (!scalar.ok) return scalar;
	return { ok: true, value: scalar.value, consumed: !inline };
}

function isNegativeNumber(token: string): boolean {
	return /^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(token);
}

function isFlagToken(token: string): boolean {
	if (token.startsWith("--")) return true;
	return token.startsWith("-") && !isNegativeNumber(token);
}

function splitList(raw: string): string[] {
	if (!raw.includes(",")) return [raw.trim()].filter((item) => item.length > 0);
	return raw
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function readJson(
	raw: string,
	flag: string,
):
	| { readonly ok: true; readonly value: unknown }
	| { readonly ok: false; readonly message: string } {
	try {
		return { ok: true, value: parseJson(raw) };
	} catch {
		return fail(`--${flag} must be JSON.`);
	}
}

function parseJson(text: string): unknown {
	return JSON.parse(text);
}

function readScalar(
	slot: ScalarSlot,
	raw: string,
):
	| { readonly ok: true; readonly value: unknown }
	| { readonly ok: false; readonly message: string } {
	if (slot.kind === "boolean") {
		if (raw !== "true" && raw !== "false") {
			return fail(`--${slot.flag} must be true or false.`);
		}
		return { ok: true, value: raw === "true" };
	}
	if (slot.kind === "string") return readStringValue(slot, raw);
	return readNumberValue(slot, raw);
}

function readStringValue(
	slot: StringSlot,
	raw: string,
):
	| { readonly ok: true; readonly value: string }
	| { readonly ok: false; readonly message: string } {
	const value = raw.trim();
	if (slot.enumValues && !slot.enumValues.includes(value)) {
		return fail(
			`--${slot.flag} must be one of: ${slot.enumValues.join(", ")}.`,
		);
	}
	if (slot.minLength !== undefined && value.length < slot.minLength) {
		return fail(
			`--${slot.flag} must be at least ${slot.minLength} characters.`,
		);
	}
	if (slot.maxLength !== undefined && value.length > slot.maxLength) {
		return fail(`--${slot.flag} must be at most ${slot.maxLength} characters.`);
	}
	if (slot.patterns && !matchesPattern(value, slot.patterns)) {
		const hint = slot.description ? ` ${slot.description}` : "";
		return fail(`--${slot.flag} does not match the expected format.${hint}`);
	}
	return { ok: true, value };
}

function matchesPattern(value: string, patterns: readonly string[]): boolean {
	let checked = false;
	for (const pattern of patterns) {
		let expression: RegExp;
		try {
			expression = new RegExp(pattern, "u");
		} catch {
			continue;
		}
		checked = true;
		if (expression.test(value)) return true;
	}
	return !checked;
}

function readNumberValue(
	slot: NumberSlot,
	raw: string,
):
	| { readonly ok: true; readonly value: number }
	| { readonly ok: false; readonly message: string } {
	const integer = slot.kind === "integer";
	if (integer && !/^[+-]?\d+$/u.test(raw))
		return fail(`--${slot.flag} must be an integer.`);
	if (!integer && !/^[+-]?(?:\d+\.?\d*|\.\d+)$/u.test(raw)) {
		return fail(`--${slot.flag} must be a number.`);
	}
	const value = Number(raw);
	if (integer && !Number.isSafeInteger(value)) {
		return fail(`--${slot.flag} must be an integer.`);
	}
	if (!Number.isFinite(value)) return fail(`--${slot.flag} must be a number.`);
	if (slot.enumValues && !slot.enumValues.some((item) => item === value)) {
		return fail(
			`--${slot.flag} must be one of: ${slot.enumValues.join(", ")}.`,
		);
	}
	if (slot.minimum !== undefined && value < slot.minimum) {
		return fail(`--${slot.flag} must be at least ${slot.minimum}.`);
	}
	if (slot.exclusiveMinimum !== undefined && value <= slot.exclusiveMinimum) {
		return fail(
			`--${slot.flag} must be greater than ${slot.exclusiveMinimum}.`,
		);
	}
	if (slot.maximum !== undefined && value > slot.maximum) {
		return fail(`--${slot.flag} must be at most ${slot.maximum}.`);
	}
	if (slot.exclusiveMaximum !== undefined && value >= slot.exclusiveMaximum) {
		return fail(`--${slot.flag} must be less than ${slot.exclusiveMaximum}.`);
	}
	return { ok: true, value };
}

function setValue(
	root: Record<string, unknown>,
	flag: string,
	value: unknown,
): void {
	const path = flag.split(".");
	const leaf = path[path.length - 1];
	if (leaf === undefined) return;
	const parent = container(root, path.slice(0, -1));
	parent[leaf] = value;
}

function appendValue(
	root: Record<string, unknown>,
	flag: string,
	value: unknown,
): void {
	const path = flag.split(".");
	const leaf = path[path.length - 1];
	if (leaf === undefined) return;
	const parent = container(root, path.slice(0, -1));
	const existing = parent[leaf];
	if (Array.isArray(existing)) {
		existing.push(value);
		return;
	}
	parent[leaf] = [value];
}

function container(
	root: Record<string, unknown>,
	path: readonly string[],
): Record<string, unknown> {
	let current = root;
	for (const key of path) {
		const next = current[key];
		if (isRecord(next)) {
			current = next;
			continue;
		}
		const created: Record<string, unknown> = {};
		current[key] = created;
		current = created;
	}
	return current;
}

function missingFlags(
	slots: readonly Slot[],
	setFlags: ReadonlySet<string>,
): string[] {
	const missing: string[] = [];
	for (const slot of slots) {
		if (setFlags.has(slot.flag)) continue;
		if (
			slot.always ||
			(slot.whenGroup !== undefined && groupTouched(slot.whenGroup, setFlags))
		) {
			missing.push(slot.flag);
		}
	}
	return missing;
}

function groupTouched(group: string, setFlags: ReadonlySet<string>): boolean {
	const prefix = `${group}.`;
	for (const flag of setFlags) {
		if (flag.startsWith(prefix)) return true;
	}
	return false;
}

function missingMessage(flags: readonly string[]): string {
	const rendered = flags.map((flag) => `--${flag}`);
	const [only] = rendered;
	if (rendered.length === 1 && only) return `Missing required flag ${only}.`;
	const last = rendered[rendered.length - 1];
	return `Missing required flags ${rendered.slice(0, -1).join(", ")} and ${last}.`;
}

function boundsMessage(
	slots: readonly Slot[],
	body: Record<string, unknown>,
): string | undefined {
	for (const slot of slots) {
		if (slot.kind !== "array") continue;
		const value = valueAt(body, slot.flag);
		if (!Array.isArray(value)) continue;
		if (slot.minItems !== undefined && value.length < slot.minItems) {
			return `--${slot.flag} needs at least ${slot.minItems} ${slot.minItems === 1 ? "value" : "values"}.`;
		}
		if (slot.maxItems !== undefined && value.length > slot.maxItems) {
			return `--${slot.flag} accepts at most ${slot.maxItems} ${slot.maxItems === 1 ? "value" : "values"}.`;
		}
	}
	return undefined;
}

function valueAt(root: Record<string, unknown>, flag: string): unknown {
	let current: unknown = root;
	for (const key of flag.split(".")) {
		if (!isRecord(current)) return undefined;
		current = current[key];
	}
	return current;
}

export function creditPhrase(credits: number): string {
	return `${credits} ${credits === 1 ? "credit" : "credits"}`;
}

/** Cost for `describe`. The catalog's `pricing` wins when the price is not flat. */
export function costLine(endpoint: {
	readonly credits?: number;
	readonly pricing?: string | null;
}): string {
	if (endpoint.pricing) return `Cost: ${endpoint.pricing}.`;
	if (endpoint.credits === undefined) return "Cost: shown in your usage.";
	return `Cost: ${creditPhrase(endpoint.credits)} per call.`;
}

/** Cost column for `endpoints`. A price that is not flat shows its lowest price. */
function costCell(endpoint: {
	readonly credits?: number;
	readonly pricing?: string | null;
}): string {
	if (endpoint.credits === undefined) return "";
	const phrase = creditPhrase(endpoint.credits);
	return endpoint.pricing ? `from ${phrase}` : phrase;
}

export function positionalSlot(slots: readonly Slot[]): StringSlot | undefined {
	const free = slots.filter(
		(slot): slot is StringSlot =>
			slot.always &&
			slot.kind === "string" &&
			!slot.enumValues &&
			!slot.flag.includes("."),
	);
	const only = free[0];
	if (free.length === 1 && only) return only;
	if (free.length > 0) return undefined;
	return slots.find(
		(slot): slot is StringSlot =>
			slot.kind === "string" && slot.flag === "query" && !slot.enumValues,
	);
}

/** Help text for `stophy <source> <command> --help`. */
export function formatEndpointHelp(endpoint: CatalogEndpoint): string {
	const slots = slotsFromInput(endpoint.input);
	const positional = positionalSlot(slots);
	const words = endpoint.id.split(".").join(" ");
	const name = positional ? argName(positional.flag) : "";
	const pair = positional ? undefined : linkOrId(endpoint.input);
	const usage = positional
		? `stophy ${words} ${positional.always ? `<${name}>` : `[${name}]`} [options]`
		: pair
			? `stophy ${words} <link-or-${argName(pair[1]).split("-").at(-1)}> [options]`
			: `stophy ${words} [options]`;
	const rows: [string, string][] = [
		...slots
			.filter((slot) => slot !== positional)
			.map((slot): [string, string] => [optionName(slot), optionText(slot)]),
		["--json", "Output as JSON"],
		["--raw", "Output the full response with its request id"],
		["-o, --output <path>", "Write to a file"],
	];
	return [
		`Usage: ${usage}`,
		...(endpoint.summary ? ["", `${endpoint.summary}.`] : []),
		"",
		"Options:",
		...alignRows(rows),
		"",
		"Example:",
		`  ${exampleLine(endpoint, slots, positional)}`,
		"",
	].join("\n");
}

/** Readable entry for `stophy describe <id>`. */
export function formatDescribe(endpoint: CatalogEndpoint): string {
	const slots = slotsFromInput(endpoint.input);
	const positional = positionalSlot(slots);
	const rows = slots.map((slot): [string, string] => [
		slot === positional
			? slot.always
				? `<${argName(slot.flag)}>`
				: `[${argName(slot.flag)}]`
			: optionName(slot),
		optionText(slot),
	]);
	return [
		endpoint.id,
		...(endpoint.summary ? [`${endpoint.summary}.`] : []),
		costLine(endpoint),
		"",
		"Options:",
		...(rows.length === 0 ? ["  (none)"] : alignRows(rows)),
		"",
		"Example:",
		`  ${exampleLine(endpoint, slots, positional)}`,
	].join("\n");
}

const KNOWN_TEXT: Readonly<Record<string, string>> = {
	cursor: "Get the next page, from a previous result",
	country: "Country code, e.g. us, de",
	language: "Language code, e.g. en, pt-BR",
};

function alignRows(rows: readonly (readonly [string, string])[]): string[] {
	const width = Math.max(...rows.map(([name]) => name.length)) + 2;
	return rows.map(([name, text]) =>
		text.length === 0 ? `  ${name}` : `  ${name.padEnd(width)}${text}`,
	);
}

function argName(flag: string): string {
	const last = flag.split(".").at(-1) ?? flag;
	return last.replace(/([a-z0-9])([A-Z])/gu, "$1-$2").toLowerCase();
}

function optionName(slot: Slot): string {
	if (slot.kind === "boolean") return `--${slot.flag}`;
	if (slot.kind === "array") return `--${slot.flag} <list>`;
	if (slot.kind === "json") return `--${slot.flag} <json>`;
	if (slot.kind === "integer" || slot.kind === "number")
		return `--${slot.flag} <number>`;
	return `--${slot.flag} <${argName(slot.flag)}>`;
}

function optionText(slot: Slot): string {
	const main = mainText(slot);
	const extras: string[] = [];
	if (slot.always) extras.push("required");
	else if (slot.sendOne) extras.push("send one");
	else if (slot.whenGroup) extras.push(`required with ${slot.whenGroup}`);
	if (slot.defaultLabel !== undefined)
		extras.push(`default: ${slot.defaultLabel}`);
	const max = maxOf(slot);
	if (max !== undefined) extras.push(`max: ${max}`);
	return extras.length === 0 ? main : `${main} (${extras.join(", ")})`;
}

function mainText(slot: Slot): string {
	const last = slot.flag.split(".").at(-1) ?? slot.flag;
	const known = KNOWN_TEXT[slot.flag];
	if (known) return known;
	if (slot.kind === "array") {
		const values = enumOf(slot.item);
		if (values.length === 0) return "Comma-separated list";
		const shown = values.slice(0, 6).join(", ");
		return `Comma-separated: ${shown}${values.length > 6 ? ", …" : ""}`;
	}
	if (slot.kind !== "json" && slot.kind !== "boolean") {
		const values = enumOf(slot);
		if (values.length > 0) return orList(values);
	}
	const described = cleanDescription(slot.description);
	if (described) return described;
	if (last === "min" || last === "max") {
		const owner = humanize(slot.flag.split(".").slice(0, -1).join(" "));
		return `${last === "min" ? "Minimum" : "Maximum"} ${owner.toLowerCase()}`;
	}
	return humanize(slot.flag.replaceAll(".", " "));
}

function enumOf(slot: ScalarSlot): string[] {
	if (slot.kind === "boolean") return [];
	return (slot.enumValues ?? []).map(String);
}

function orList(values: readonly string[]): string {
	if (values.length === 1) return values[0] ?? "";
	return `${values.slice(0, -1).join(", ")} or ${values.at(-1)}`;
}

function maxOf(slot: Slot): number | undefined {
	if (slot.kind === "integer" || slot.kind === "number") {
		if (slot.enumValues && slot.enumValues.length > 0) return undefined;
		return slot.maximum;
	}
	if (slot.kind === "array")
		return enumOf(slot.item).length > 0 ? undefined : slot.maxItems;
	return undefined;
}

function cleanDescription(description: string | undefined): string | undefined {
	if (!description) return undefined;
	const first = description
		.split(/(?<=\.)\s+/u)
		.filter((part) => !/any case is accepted/iu.test(part))[0];
	const text = first?.replace(/\.+$/u, "").trim();
	if (!text) return undefined;
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function humanize(name: string): string {
	const words = name
		.replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
		.toLowerCase()
		.trim();
	return words.charAt(0).toUpperCase() + words.slice(1);
}

function exampleLine(
	endpoint: CatalogEndpoint,
	slots: readonly Slot[],
	positional: StringSlot | undefined,
): string {
	const words = endpoint.id.split(".").join(" ");
	const sample = isRecord(endpoint.example) ? endpoint.example : undefined;
	const pieces: string[] = [`stophy ${words}`];
	const pair = positional ? undefined : linkOrId(endpoint.input);
	const given = pair?.find((flag) => typeof sample?.[flag] === "string");
	if (positional) {
		const value = sample?.[positional.flag];
		pieces.push(quoteArg(typeof value === "string" ? value : "..."));
	} else if (given) {
		pieces.push(quoteArg(String(sample?.[given])));
	}
	const extras = sample
		? Object.entries(sample).filter(
				([key, value]) =>
					key !== positional?.flag &&
					key !== given &&
					key !== "cursor" &&
					(typeof value === "string" ||
						typeof value === "number" ||
						typeof value === "boolean"),
			)
		: [];
	for (const [key, value] of extras.slice(0, 2)) {
		pieces.push(
			value === true ? `--${key}` : `--${key} ${quoteArg(String(value))}`,
		);
	}
	if (!sample)
		pieces.push(...examplePieces(slots.filter((slot) => slot !== positional)));
	return pieces.join(" ");
}

function quoteArg(value: string): string {
	return /^[A-Za-z0-9._:/@,+-]+$/u.test(value) ? value : JSON.stringify(value);
}

/** `stophy endpoints` listing. Keyless endpoints are marked free. */
export function formatEndpointIndex(
	endpoints: readonly Pick<
		CatalogEndpoint,
		"id" | "credits" | "pricing" | "keyless"
	>[],
	term?: string,
): string {
	const query = term?.trim().toLowerCase() ?? "";
	const rows = endpoints
		.filter(
			(endpoint) =>
				query.length === 0 || endpoint.id.toLowerCase().includes(query),
		)
		.slice()
		.sort((left, right) => left.id.localeCompare(right.id));
	if (rows.length === 0) {
		return query.length === 0
			? "No endpoints."
			: `No endpoints match \`${term?.trim()}\`.`;
	}
	const idWidth = Math.max(...rows.map((row) => row.id.length));
	const costs = rows.map(costCell);
	const costWidth = Math.max(...costs.map((cost) => cost.length));
	return rows
		.map((row, index) => {
			const cost = costs[index] ?? "";
			const free = row.keyless ? "  free" : "";
			return `${row.id.padEnd(idWidth)}  ${cost.padEnd(costWidth)}${free}`;
		})
		.join("\n");
}

function examplePieces(slots: readonly Slot[]): string[] {
	const pieces: string[] = [];
	for (const slot of slots) {
		if (!slot.always) continue;
		const sample = sampleValue(slot);
		if (sample === undefined) pieces.push(`--${slot.flag}`);
		else pieces.push(`--${slot.flag}`, sample);
	}
	return pieces;
}

function sampleValue(slot: Slot): string | undefined {
	if (slot.kind === "boolean") return undefined;
	if (slot.kind === "string") return slot.enumValues?.[0] ?? '"..."';
	if (slot.kind === "integer")
		return String(slot.enumValues?.[0] ?? slot.minimum ?? 1);
	if (slot.kind === "number") {
		const sample =
			slot.enumValues?.[0] ??
			(slot.exclusiveMinimum !== undefined
				? slot.exclusiveMinimum + 1
				: (slot.minimum ?? 1));
		return String(sample);
	}
	if (slot.kind === "json") return "'{}'";
	if (slot.kind === "array") return sampleValue(slot.item) ?? "true";
	return undefined;
}
