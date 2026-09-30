import { currentArgs, flagTokens } from "./argv.js";
import type { CatalogEndpoint } from "./catalog.js";
import { request } from "./client.js";
import { CliError } from "./errors.js";
import { parseCall } from "./flags.js";
import { handleOutput, writeOutput } from "./output.js";
import { renderData } from "./render.js";
import { withSpinner } from "./spinner.js";
import { successEnvelope } from "./types/api.js";

/** Call one catalog endpoint and print readable text, JSON data, or the raw envelope. */
export async function runEndpoint(endpoint: CatalogEndpoint): Promise<void> {
	const parsed = parseCall(
		flagTokens(currentArgs(), endpoint.id.split(".")),
		endpoint.input,
	);
	if (!parsed.ok) throw new CliError(parsed.message);

	const response = await withSpinner(
		`Calling ${endpoint.id.split(".").join(" ")}…`,
		() =>
			request({
				method: "POST",
				path: endpoint.path,
				body: parsed.call.body,
				accept: "application/json",
			}),
	);

	const envelope = successEnvelope.safeParse(response.json);
	if (!envelope.success)
		throw new CliError("Server returned an unexpected response shape.");
	if (parsed.call.format === "json") {
		process.stderr.write(`credits used: ${envelope.data.creditsUsed}\n`);
	}
	if (parsed.call.format === "text") {
		writeOutput(renderData(envelope.data.data), parsed.call.outputFile);
		return;
	}
	handleOutput(
		parsed.call.format === "raw" ? envelope.data : envelope.data.data,
		{
			output: parsed.call.outputFile,
		},
	);
}
