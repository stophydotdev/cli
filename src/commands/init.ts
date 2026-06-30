import { spawn } from "node:child_process";
import type { Command } from "commander";
import { green } from "../color.js";
import { CliError } from "../errors.js";
import { doBrowserLogin } from "../prompt-login.js";
import type { InitOptions } from "../types/init.js";

const err = (message: string) => process.stderr.write(`${message}\n`);

export interface InitDependencies {
	browserLogin: () => Promise<void>;
	runCommand: (command: string, args: string[]) => Promise<void>;
}

function executable(name: "npm" | "npx"): string {
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

const defaultDependencies: InitDependencies = {
	browserLogin: () => doBrowserLogin({ promptBeforeOpen: false }),
	runCommand,
};

export async function runInit(
	options: InitOptions,
	dependencies: InitDependencies = defaultDependencies,
) {
	err("Installing the latest Stophy CLI globally...");
	await dependencies.runCommand(executable("npm"), [
		"install",
		"--global",
		"@stophy/cli@latest",
	]);

	if (options.all) {
		err("Installing all Stophy skills globally for all agents...");
		await dependencies.runCommand(executable("npx"), [
			"-y",
			"skills@latest",
			"add",
			"stophydotdev/skills",
			"--all",
			"--global",
		]);
	}

	if (options.browser) {
		err("Opening browser authentication...");
		await dependencies.browserLogin();
	}

	err(green("Stophy setup complete."));
}

export function registerInitCommand(program: Command) {
	program
		.command("init")
		.description("Install Stophy, agent skills, and authentication")
		.option("--all", "Install all Stophy skills globally for all agents")
		.option("--browser", "Authenticate by opening the Stophy login page")
		.addHelpText(
			"after",
			"\nExample:\n  npx -y @stophy/cli@latest init --all --browser\n",
		)
		.action(async (options: InitOptions) => {
			await runInit(options);
		});
}
