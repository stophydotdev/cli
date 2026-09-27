import type { Command } from "commander";
import type { CatalogEndpoint } from "../catalog.js";
import { formatEndpointIndex } from "../flags.js";
import { writeOutput } from "../output.js";

export function registerEndpointsCommand(
	program: Command,
	endpoints: readonly CatalogEndpoint[],
) {
	program
		.command("endpoints")
		.description(
			"List endpoints, with credits and a free marker for keyless ones",
		)
		.argument("[term]", "Only show ids that contain this text")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy endpoints
  $ stophy endpoints youtube
  $ stophy --refresh endpoints
`,
		)
		.action((term?: string) => {
			writeOutput(formatEndpointIndex(endpoints, term));
		});
}
