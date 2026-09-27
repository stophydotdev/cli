import type { Command } from "commander";
import type { CatalogEndpoint } from "../catalog.js";
import { CliError } from "../errors.js";
import { formatDescribe } from "../flags.js";
import { writeOutput } from "../output.js";

export function registerDescribeCommand(
	program: Command,
	endpoints: readonly CatalogEndpoint[],
) {
	const byId = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));
	program
		.command("describe")
		.description("Show an endpoint's input schema, cost, and path")
		.argument("<id>", "Endpoint id, for example youtube.search")
		.addHelpText(
			"after",
			`
Example:
  $ stophy describe youtube.search
`,
		)
		.action((id: string) => {
			const endpoint = byId.get(id);
			if (!endpoint) {
				const source = id.split(".")[0] ?? "";
				throw new CliError(
					`No endpoint \`${id}\`. Run \`stophy endpoints${source ? ` ${source}` : ""}\`.`,
				);
			}
			writeOutput(formatDescribe(endpoint));
		});
}
