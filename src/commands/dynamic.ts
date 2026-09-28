import type { Command } from "commander";
import type { CatalogEndpoint, CatalogSource } from "../catalog.js";
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
	sources: readonly CatalogSource[] = [],
): void {
	const summaries = new Map(
		sources.map((source) => [source.id, source.summary]),
	);
	for (const [name, node] of tree(endpoints)) {
		registerNode(
			program,
			name,
			node,
			run,
			summaries.get(name) ?? sourceLabel(name),
		);
	}
}

export function sourceLabel(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1);
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
	label: string,
): void {
	const command = parent.command(name);
	const endpoint = node.endpoint;
	if (endpoint) {
		command
			.description(endpoint.summary ?? label)
			.allowUnknownOption(true)
			.allowExcessArguments(true)
			.action(async () => {
				await run(endpoint);
			});
		command.helpInformation = () =>
			[formatEndpointHelp(endpoint), ...childLines(node, label)].join("\n");
	} else {
		command.description(label).action(() => {
			command.outputHelp();
		});
	}
	for (const [childName, child] of node.children) {
		registerNode(
			command,
			childName,
			child,
			run,
			firstSummary(child) ?? sourceLabel(childName),
		);
	}
}

function firstSummary(node: TreeNode): string | undefined {
	if (node.endpoint?.summary) return node.endpoint.summary;
	for (const child of node.children.values()) {
		const found = firstSummary(child);
		if (found) return found;
	}
	return undefined;
}

function childLines(node: TreeNode, label: string): string[] {
	const rows = [...node.children].map(([name, child]) => [
		name,
		firstSummary(child) ?? label,
	]);
	if (rows.length === 0) return [];
	const width = Math.max(...rows.map(([name]) => (name ?? "").length)) + 2;
	return [
		"Commands:",
		...rows.map(([name, text]) => `  ${(name ?? "").padEnd(width)}${text}`),
		"",
	];
}
