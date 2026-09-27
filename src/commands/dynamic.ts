import type { Command } from "commander";
import type { CatalogEndpoint } from "../catalog.js";
import { CliError } from "../errors.js";
import { formatEndpointHelp } from "../flags.js";
import { runEndpoint } from "../invoke.js";

const RESERVED = new Set([
	"login",
	"init",
	"logout",
	"view-config",
	"version",
	"doctor",
	"status",
	"usage",
	"logs",
	"endpoints",
	"describe",
	"help",
]);

interface TreeNode {
	endpoint?: CatalogEndpoint;
	children: Map<string, TreeNode>;
}

/** Register `stophy <source> <endpoint words>` from the live catalog. */
export function registerDynamicCommands(
	program: Command,
	endpoints: readonly CatalogEndpoint[],
	run: (endpoint: CatalogEndpoint) => Promise<void> = runEndpoint,
): void {
	for (const [name, node] of tree(endpoints)) {
		registerNode(program, name, node, run);
	}
}

/** Dot-id of the command being run, such as `youtube.comments.replies`. */
export function commandPath(command: Command): string | undefined {
	const names: string[] = [];
	let current: Command | null = command;
	while (current?.parent) {
		names.unshift(current.name());
		current = current.parent;
	}
	return names.length === 0 ? undefined : names.join(".");
}

function tree(endpoints: readonly CatalogEndpoint[]): Map<string, TreeNode> {
	const roots = new Map<string, TreeNode>();
	for (const endpoint of endpoints) {
		const parts = endpoint.id.split(".");
		const source = parts[0];
		if (source && RESERVED.has(source)) {
			throw new CliError(
				`Endpoint \`${endpoint.id}\` uses reserved command \`${source}\`.`,
			);
		}
		let level = roots;
		let node: TreeNode | undefined;
		for (const part of parts) {
			let child = level.get(part);
			if (!child) {
				child = { children: new Map() };
				level.set(part, child);
			}
			node = child;
			level = child.children;
		}
		if (node) node.endpoint = endpoint;
	}
	return roots;
}

function registerNode(
	parent: Command,
	name: string,
	node: TreeNode,
	run: (endpoint: CatalogEndpoint) => Promise<void>,
): void {
	const command = parent.command(name);
	const endpoint = node.endpoint;
	if (endpoint) {
		command
			.description(endpoint.id)
			.allowUnknownOption(true)
			.allowExcessArguments(true)
			.addHelpText("after", formatEndpointHelp(endpoint))
			.action(async () => {
				await run(endpoint);
			});
	} else {
		command.description(`${name} endpoints`).action(() => {
			command.outputHelp();
		});
	}
	for (const [childName, child] of node.children) {
		registerNode(command, childName, child, run);
	}
}
