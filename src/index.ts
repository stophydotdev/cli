#!/usr/bin/env node

import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" };
import { registerAccountCommands } from "./commands/account.js";
import { registerChannelCommand } from "./commands/channel.js";
import { registerCreditsCommand } from "./commands/credits.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerKidsCommands } from "./commands/kids.js";
import { registerLoginCommand } from "./commands/login.js";
import { registerLogsCommand } from "./commands/logs.js";
import { registerMusicCommands } from "./commands/music.js";
import { registerPlaylistCommand } from "./commands/playlist.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerSuggestCommand } from "./commands/suggest.js";
import { registerUsageCommand } from "./commands/usage.js";
import { registerVersionCommand } from "./commands/version.js";
import { registerVideoCommands } from "./commands/video.js";
import { resolveRuntimeConfig } from "./config.js";
import { toCliError } from "./errors.js";
import { promptLogin } from "./prompt-login.js";
import { maybeShowUpdateNotice } from "./update-notice.js";

const program = new Command();

program
	.name("stophy")
	.version(packageJson.version)
	.description(
		"YouTube context for AI agents. Search, transcripts, comments, channels, playlists — structured JSON from the terminal.",
	)
	.showHelpAfterError()
	.action(() => {
		program.outputHelp();
	});

registerInitCommand(program);
registerLoginCommand(program);
registerAccountCommands(program);
registerVersionCommand(program);
registerStatusCommand(program);
registerDoctorCommand(program);
registerSearchCommand(program);
registerSuggestCommand(program);
registerMusicCommands(program);
registerKidsCommands(program);
registerVideoCommands(program);
registerChannelCommand(program);
registerPlaylistCommand(program);
registerCreditsCommand(program);
registerUsageCommand(program);
registerLogsCommand(program);

const NO_AUTH_COMMANDS = new Set([
	"login",
	"init",
	"logout",
	"view-config",
	"version",
	"status",
	"doctor",
]);

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
	await maybeShowUpdateNotice();
}

main().catch((error) => {
	const cliError = toCliError(error);
	console.error(cliError.message);
	process.exit(cliError.exitCode);
});
