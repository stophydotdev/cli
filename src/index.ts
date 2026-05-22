#!/usr/bin/env bun

import { Command } from "commander";
import packageJson from "../package.json";
import { registerAccountCommands } from "./commands/account";
import { registerChannelCommand } from "./commands/channel";
import { registerLoginCommand } from "./commands/login";
import { registerLogsCommand } from "./commands/logs";
import { registerPlaylistCommand } from "./commands/playlist";
import { registerSearchCommand } from "./commands/search";
import { registerShortsCommand } from "./commands/shorts";
import { registerTrendingCommand } from "./commands/trending";
import { registerUsageCommand } from "./commands/usage";
import { registerVideoCommands } from "./commands/video";
import { toCliError } from "./errors";

const program = new Command();

program
	.name("stophy")
	.version(packageJson.version)
	.description("CLI for the Stophy YouTube data API")
	.showHelpAfterError();

registerLoginCommand(program);
registerAccountCommands(program);
registerSearchCommand(program);
registerVideoCommands(program);
registerChannelCommand(program);
registerPlaylistCommand(program);
registerTrendingCommand(program);
registerShortsCommand(program);
registerUsageCommand(program);
registerLogsCommand(program);

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
