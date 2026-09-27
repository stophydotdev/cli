const SKIP_CATALOG = new Set([
	"login",
	"init",
	"logout",
	"view-config",
	"version",
	"doctor",
	"status",
	"usage",
	"logs",
]);

let invocation: readonly string[] = [];

/** Remember the args Commander is parsing, so endpoint commands can read flags from them. */
export function setCurrentArgs(args: readonly string[]): void {
	invocation = args;
}

export function currentArgs(): readonly string[] {
	return invocation;
}

/** `--refresh` is global and may sit anywhere on the command line. */
export function stripGlobalRefresh(args: readonly string[]): {
	args: string[];
	refresh: boolean;
} {
	let refresh = false;
	const next: string[] = [];
	for (const arg of args) {
		if (arg === "--refresh") {
			refresh = true;
			continue;
		}
		next.push(arg);
	}
	return { args: next, refresh };
}

/** The first positional token, skipping options. */
export function firstCommand(args: readonly string[]): string | undefined {
	for (const arg of args) {
		if (arg === "--") return undefined;
		if (arg.startsWith("-")) continue;
		return arg;
	}
	return undefined;
}

/** Data, discovery, and account commands need the endpoint catalog. Login and diagnostics do not. */
export function catalogNeeded(args: readonly string[]): boolean {
	const command = firstCommand(args);
	if (command === undefined) return true;
	return !SKIP_CATALOG.has(command);
}

/** Root help can still run when the catalog cannot be loaded. */
export function catalogOptional(args: readonly string[]): boolean {
	return firstCommand(args) === undefined;
}

/** Flags and positionals that follow a command path such as `youtube search`. */
export function flagTokens(
	args: readonly string[],
	words: readonly string[],
): string[] {
	const start = findWords(args, words);
	if (start < 0) return [];
	return args.slice(start + words.length);
}

function findWords(args: readonly string[], words: readonly string[]): number {
	if (words.length === 0) return 0;
	for (let index = 0; index <= args.length - words.length; index++) {
		let matched = true;
		for (let offset = 0; offset < words.length; offset++) {
			if (args[index + offset] !== words[offset]) {
				matched = false;
				break;
			}
		}
		if (matched) return index;
	}
	return -1;
}
