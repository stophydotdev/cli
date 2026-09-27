#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" };
import {
	catalogNeeded,
	catalogOptional,
	setCurrentArgs,
	stripGlobalRefresh,
} from "./argv.js";
import {
	type CatalogEndpoint,
	catalogFilePath,
	fetchCatalog,
	loadCatalog,
} from "./catalog.js";
import { registerAccountCommands } from "./commands/account.js";
import { registerDescribeCommand } from "./commands/describe.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { commandPath, registerDynamicCommands } from "./commands/dynamic.js";
import { registerEndpointsCommand } from "./commands/endpoints.js";
import { registerInitCommand } from "./commands/init.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerLogsCommand } from "./commands/logs.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerUsageCommand } from "./commands/usage.js";
import { registerVersionCommand } from "./commands/version.js";
import { resolveRuntimeConfig } from "./config.js";
import { toCliError } from "./errors.js";
import { promptLogin } from "./prompt-login.js";
import { maybeShowUpdateNotice } from "./update-notice.js";

const NO_AUTH_COMMANDS = new Set([
	"login",
	"init",
	"logout",
	"view-config",
	"version",
	"doctor",
	"status",
	"endpoints",
	"describe",
	"help",
]);

function buildProgram(endpoints: readonly CatalogEndpoint[]): Command {
	const program = new Command();
	const byId = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));

	program
		.name("stophy")
		.version(packageJson.version)
		.description(
			"Web data for AI agents. Call any Stophy endpoint from the terminal.",
		)
		.showHelpAfterError()
		.addHelpText(
			"after",
			`
--refresh reloads the endpoint catalog.

Examples:
  $ stophy endpoints youtube
  $ stophy describe youtube.search
  $ stophy youtube search --query "bun runtime" --limit 5
  $ stophy maps search --query dentist --near Berlin --country DE
`,
		)
		.action(() => {
			program.outputHelp();
		});

	registerInitCommand(program);
	registerLoginCommand(program);
	registerAccountCommands(program);
	registerEndpointsCommand(program, endpoints);
	registerDescribeCommand(program, endpoints);
	registerDynamicCommands(program, endpoints);
	registerUsageCommand(program);
	registerLogsCommand(program);
	registerStatusCommand(program);
	registerDoctorCommand(program);
	registerVersionCommand(program);

	program.hook("preAction", async (_thisCommand, actionCommand) => {
		const id = commandPath(actionCommand);
		const endpoint = id === undefined ? undefined : byId.get(id);
		if (endpoint?.keyless) return;
		if (!endpoint && actionCommand.commands.length > 0) return;
		if (!endpoint && NO_AUTH_COMMANDS.has(actionCommand.name())) return;
		const { apiKey, sessionCookie } = await resolveRuntimeConfig();
		if (!(apiKey || sessionCookie)) await promptLogin();
	});

	program.configureOutput({
		outputError: (text, write) => write(text),
	});

	return program;
}

async function main() {
	const { args, refresh } = stripGlobalRefresh(process.argv.slice(2));
	setCurrentArgs(args);

	let endpoints: readonly CatalogEndpoint[] = [];
	let background: Promise<void> | undefined;
	if (catalogNeeded(args)) {
		try {
			const loaded = await loadCatalog({
				file: catalogFilePath(),
				now: Date.now(),
				force: refresh,
				fetch: fetchCatalog,
				warn: (message) => {
					process.stderr.write(`${message}\n`);
				},
			});
			endpoints = loaded.endpoints;
			background = loaded.background;
		} catch (error) {
			if (!catalogOptional(args)) throw error;
			const message =
				error instanceof Error
					? error.message
					: "Could not load the endpoint catalog.";
			process.stderr.write(`${message}\n`);
		}
	}

	const program = buildProgram(endpoints);
	try {
		await program.parseAsync(args, { from: "user" });
	} finally {
		if (background) await background;
	}
	await maybeShowUpdateNotice();
}

main().catch((error) => {
	const cliError = toCliError(error);
	console.error(cliError.message);
	process.exit(cliError.exitCode);
});
