import { mkdirSync } from "node:fs";
import { expect, test } from "bun:test";
import { Command } from "commander";

const home = `/tmp/stophy-cli-commands-${process.pid}`;
mkdirSync(home, { recursive: true });
process.env.XDG_CONFIG_HOME = home;

test("nested catalog commands reach the matching endpoint", async () => {
	const { registerDynamicCommands } = await import("../src/commands/dynamic.ts");
	const called: string[] = [];
	const program = new Command();
	program.exitOverride();
	registerDynamicCommands(
		program,
		[
			{
				id: "youtube.search",
				method: "POST",
				path: "/v1/youtube/search",
				credits: 1,
				keyless: false,
				input: {
					type: "object",
					properties: { query: { type: "string", minLength: 1 } },
					required: ["query"],
				},
			},
			{
				id: "youtube.comments",
				method: "POST",
				path: "/v1/youtube/comments",
				credits: 1,
				keyless: false,
				input: {
					type: "object",
					properties: { video: { type: "string" } },
					required: ["video"],
				},
			},
			{
				id: "transcript",
				method: "POST",
				path: "/v1/transcript",
				credits: 2,
				keyless: false,
				input: {
					type: "object",
					properties: { video: { type: "string" } },
					required: ["video"],
				},
			},
		],
		async (endpoint) => {
			called.push(endpoint.id);
		},
	);

	const youtube = program.commands.find((command) => command.name() === "youtube");
	const search = youtube?.commands.find((command) => command.name() === "search");
	const help: string[] = [];
	search?.configureOutput({
		writeOut: (text) => {
			help.push(text);
		},
		writeErr: (text) => {
			help.push(text);
		},
	});
	search?.outputHelp();
	expect(help.join("")).toContain("Usage: stophy youtube search <query> [options]");
	expect(help.join("")).not.toContain("youtube.search");

	await program.parseAsync(["youtube", "search", "--query", "bun"], { from: "user" });
	await program.parseAsync(["transcript", "https://youtu.be/M4TufsFlv_o"], { from: "user" });
	expect(called).toEqual(["youtube.search", "transcript"]);
});

test("sources show their summary, or their name when the server has none", async () => {
	const { registerDynamicCommands } = await import("../src/commands/dynamic.ts");
	const endpoint = {
		id: "reddit.search",
		summary: "Search Reddit posts",
		method: "POST" as const,
		path: "/v1/reddit/search",
		credits: 2,
		keyless: false,
		input: { type: "object", properties: {} },
	};
	const withSummary = new Command();
	registerDynamicCommands(withSummary, [endpoint], async () => {}, [
		{ id: "reddit", summary: "Search posts, read threads, subreddits and users" },
	]);
	expect(withSummary.helpInformation()).toContain("Search posts, read threads, subreddits and users");

	const without = new Command();
	registerDynamicCommands(without, [{ ...endpoint, summary: undefined }], async () => {});
	const help = without.helpInformation();
	expect(help).toMatch(/reddit +Reddit/u);
	expect(help).not.toContain("endpoints");
});
