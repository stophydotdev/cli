import assert from "node:assert/strict";
import test from "node:test";
import { runInit } from "../dist/commands/init.js";

test("init --all --browser installs everything and authenticates", async () => {
	const calls = [];
	const dependencies = {
		browserLogin: async () => calls.push(["browser"]),
		runCommand: async (command, args) => calls.push([command, ...args]),
	};

	await runInit({ all: true, browser: true }, dependencies);

	assert.deepEqual(calls, [
		["npm", "install", "--global", "@stophy/cli@latest"],
		[
			"npx",
			"-y",
			"skills@latest",
			"add",
			"stophydotdev/skills",
			"--all",
			"--global",
		],
		["browser"],
	]);
});

test("init without flags only installs the CLI", async () => {
	const calls = [];
	const dependencies = {
		browserLogin: async () => calls.push(["browser"]),
		runCommand: async (command, args) => calls.push([command, ...args]),
	};

	await runInit({}, dependencies);

	assert.deepEqual(calls, [
		["npm", "install", "--global", "@stophy/cli@latest"],
	]);
});
