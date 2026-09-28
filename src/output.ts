import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { OutputOptions } from "./types/api.js";

export function writeOutput(content: string, output?: string, silent = false) {
	if (output) {
		const dir = dirname(output);
		if (dir) mkdirSync(dir, { recursive: true });
		writeFileSync(
			output,
			content.endsWith("\n") ? content : `${content}\n`,
			"utf8",
		);
		if (!silent) console.error(`Output written to: ${output}`);
		return;
	}
	process.stdout.write(content.endsWith("\n") ? content : `${content}\n`);
}

export function handleOutput(value: unknown, options: OutputOptions = {}) {
	writeOutput(
		JSON.stringify(value, null, 2) ?? "null",
		options.output,
		Boolean(options.output),
	);
}
