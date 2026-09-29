import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { delimiter, join } from "node:path";
import { type Command, Option } from "commander";
import prompts from "prompts";
import { green } from "../color.js";
import { resolveRuntimeConfig } from "../config.js";
import { CliError } from "../errors.js";
import { doBrowserLogin } from "../prompt-login.js";
import type { InitOptions } from "../types/init.js";

const MCP_URL = "https://api.stophy.dev/mcp-oauth";
const SKILLS_PACKAGE = "stophydotdev/skills";
const NEXT_STEP = 'stophy web search "latest bun release" --limit 3';

const err = (message: string) => process.stderr.write(`${message}\n`);

type Outcome = "done" | "skipped" | "manual" | "failed";

interface StepResult {
	readonly name: string;
	readonly outcome: Outcome;
	readonly note: string;
}

/** Everything `init` does outside its own process, so tests can replace it. */
export interface InitDependencies {
	isLoggedIn: () => Promise<boolean>;
	browserLogin: () => Promise<void>;
	runCommand: (command: string, args: string[]) => Promise<void>;
	commandExists: (name: string) => Promise<boolean>;
	confirm: (question: string) => Promise<boolean>;
	interactive: boolean;
}

function executable(name: "npx"): string {
	return process.platform === "win32" ? `${name}.cmd` : name;
}

async function runCommand(command: string, args: string[]): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, { stdio: "inherit" });

		child.once("error", (error) => {
			reject(new CliError(`Could not run ${command}: ${error.message}`));
		});
		child.once("close", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(new CliError(`${command} exited with code ${code ?? "unknown"}.`));
		});
	});
}

async function commandExists(name: string): Promise<boolean> {
	const extensions =
		process.platform === "win32"
			? (process.env.PATHEXT ?? ".EXE;.CMD").split(";")
			: [""];
	for (const directory of (process.env.PATH ?? "").split(delimiter)) {
		for (const extension of extensions) {
			try {
				await access(join(directory, `${name}${extension}`));
				return true;
			} catch {}
		}
	}
	return false;
}

async function confirm(question: string): Promise<boolean> {
	const { value } = await prompts({
		type: "confirm",
		name: "value",
		message: question,
		initial: true,
	});
	return value === true;
}

const defaultDependencies: InitDependencies = {
	isLoggedIn: async () => {
		const { apiKey, sessionCookie } = await resolveRuntimeConfig();
		return Boolean(apiKey || sessionCookie);
	},
	browserLogin: () => doBrowserLogin({ promptBeforeOpen: false }),
	runCommand,
	commandExists,
	confirm,
	interactive: !!process.stdin.isTTY,
};

const messageOf = (error: unknown) =>
	error instanceof Error ? error.message : "Unknown error.";

const isClaudeCode = (agent: string | undefined) =>
	agent === undefined || agent === "claude-code" || agent === "claude";

/** Exact instructions for adding the MCP server to an agent we do not edit. */
export function mcpInstructions(agent: string | undefined): string[] {
	if (isClaudeCode(agent)) {
		return [`claude mcp add --transport http stophy ${MCP_URL}`];
	}
	if (agent === "codex") {
		return [`codex mcp add stophy --url ${MCP_URL}`, "codex mcp login stophy"];
	}
	return [
		"Add this server to your agent's MCP settings:",
		JSON.stringify({ mcpServers: { stophy: { url: MCP_URL } } }, null, 2),
	];
}

/** The `skills add` arguments: fully non-interactive with --all, the tool's own prompts otherwise. */
export function skillsArgs(options: InitOptions): string[] {
	const args = ["-y", "skills", "add", SKILLS_PACKAGE];
	if (options.agent) args.push("--agent", options.agent);
	if (options.all) {
		if (!options.agent) args.push("--agent", "*");
		args.push("--skill", "*", "--yes", "--global");
	}
	return args;
}

async function wanted(
	options: InitOptions,
	dependencies: InitDependencies,
	question: string,
): Promise<boolean> {
	if (options.all || !dependencies.interactive) return true;
	return dependencies.confirm(question);
}

async function authStep(
	options: InitOptions,
	dependencies: InitDependencies,
): Promise<StepResult> {
	const name = "Login";
	if (options.skipAuth)
		return { name, outcome: "skipped", note: "--skip-auth" };
	if (await dependencies.isLoggedIn()) {
		return { name, outcome: "skipped", note: "already logged in" };
	}
	if (
		!(await wanted(options, dependencies, "Log in to Stophy in your browser?"))
	) {
		return { name, outcome: "skipped", note: "declined" };
	}
	err("Opening browser authentication...");
	try {
		await dependencies.browserLogin();
		return { name, outcome: "done", note: "logged in" };
	} catch (error) {
		return { name, outcome: "failed", note: messageOf(error) };
	}
}

async function skillsStep(
	options: InitOptions,
	dependencies: InitDependencies,
): Promise<StepResult> {
	const name = "Skills";
	if (options.skipSkills) {
		return { name, outcome: "skipped", note: "--skip-skills" };
	}
	if (!(await wanted(options, dependencies, "Install the Stophy skills?"))) {
		return { name, outcome: "skipped", note: "declined" };
	}
	err("Installing the Stophy skills...");
	try {
		await dependencies.runCommand(executable("npx"), skillsArgs(options));
		return { name, outcome: "done", note: "installed" };
	} catch (error) {
		return { name, outcome: "failed", note: messageOf(error) };
	}
}

async function mcpStep(
	options: InitOptions,
	dependencies: InitDependencies,
): Promise<StepResult> {
	const name = "MCP server";
	if (options.skipMcp) return { name, outcome: "skipped", note: "--skip-mcp" };
	const canAdd =
		isClaudeCode(options.agent) && (await dependencies.commandExists("claude"));
	if (canAdd) {
		if (
			!(await wanted(
				options,
				dependencies,
				"Add the Stophy MCP server to Claude Code?",
			))
		) {
			return { name, outcome: "skipped", note: "declined" };
		}
		err("Adding the Stophy MCP server to Claude Code...");
		try {
			await dependencies.runCommand("claude", [
				"mcp",
				"add",
				"--transport",
				"http",
				"stophy",
				MCP_URL,
			]);
			return { name, outcome: "done", note: "added to Claude Code" };
		} catch (error) {
			return { name, outcome: "failed", note: messageOf(error) };
		}
	}
	err("Add the Stophy MCP server yourself:");
	for (const line of mcpInstructions(options.agent)) err(`  ${line}`);
	return { name, outcome: "manual", note: "run the command above" };
}

function summary(results: readonly StepResult[]) {
	err("");
	for (const { name, outcome, note } of results) {
		const mark = outcome === "done" ? green("ok") : outcome;
		err(`  ${name.padEnd(11)} ${mark}: ${note}`);
	}
	err("");
	err("Next, try it:");
	err(`  ${NEXT_STEP}`);
}

export async function runInit(
	options: InitOptions,
	dependencies: InitDependencies = defaultDependencies,
) {
	const results: StepResult[] = [];
	results.push(await authStep(options, dependencies));
	results.push(await skillsStep(options, dependencies));
	results.push(await mcpStep(options, dependencies));
	summary(results);

	const failed = results.filter((result) => result.outcome === "failed");
	if (failed.length > 0) {
		throw new CliError(
			`Setup did not finish: ${failed.map((result) => result.name).join(", ")}.`,
		);
	}
}

export function registerInitCommand(program: Command) {
	program
		.command("init")
		.description("Log in, install the agent skills, and add the MCP server")
		.option("--all", "Run every step without asking")
		.option("--agent <name>", "Set up one agent, such as claude-code or codex")
		.option("--skip-auth", "Do not log in")
		.option("--skip-skills", "Do not install the skills")
		.option("--skip-mcp", "Do not add the MCP server")
		.addOption(new Option("--browser").hideHelp())
		.addHelpText("after", "\nExample:\n  npx -y @stophy/cli init --all\n")
		.action(async (options: InitOptions) => {
			await runInit(options);
		});
}
