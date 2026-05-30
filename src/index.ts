#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../package.json";
import { registerAccountCommands } from "./commands/account";
import { registerChannelCommand } from "./commands/channel";
import { registerCreditsCommand } from "./commands/credits";
import { registerLoginCommand } from "./commands/login";
import { registerLogsCommand } from "./commands/logs";
import { registerPlaylistCommand } from "./commands/playlist";
import { registerSearchCommand } from "./commands/search";
import { registerSuggestCommand } from "./commands/suggest";
import { registerUsageCommand } from "./commands/usage";
import { registerVideoCommands } from "./commands/video";
import { toCliError } from "./errors";
import { promptLogin } from "./prompt-login";
import { resolveRuntimeConfig } from "./config";

const program = new Command();

program
	.name("stophy")
	.version(packageJson.version)
	.description("Search, extract and analyze YouTube from the terminal")
	.showHelpAfterError()
	.action(() => {
		program.outputHelp();
	});

registerLoginCommand(program);
registerAccountCommands(program);
registerSearchCommand(program);
registerSuggestCommand(program);
registerVideoCommands(program);
registerChannelCommand(program);
registerPlaylistCommand(program);
registerCreditsCommand(program);
registerUsageCommand(program);
registerLogsCommand(program);

const NO_AUTH_COMMANDS = new Set(["login", "logout", "view-config"]);

program.hook("preAction", async (_thisCommand, actionCommand) => {
	const name = actionCommand.name();
	if (NO_AUTH_COMMANDS.has(name)) return;
	const { apiKey, sessionCookie } = await resolveRuntimeConfig();
	if (!(apiKey || sessionCookie)) {
		await promptLogin();
	}
});

program.configureOutput({
	outputError: (text, write) => write(text),
});

async function main() {
	await program.parseAsync(process.argv);
}

main().catch((error) => {
	const cliError = toCliError(error);
	console.error(cliError.message);
	process.exit(cliError.exitCode);
});
