#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(__dirname, "../src/index.ts");
const args = process.argv.slice(2);

const result = spawnSync("bun", ["run", entry, ...args], {
	stdio: "inherit",
});

process.exit(result.status ?? 1);
