export class CliError extends Error {
	readonly details?: unknown;
	readonly exitCode: number;

	constructor(message: string, exitCode = 1, details?: unknown) {
		super(message);
		this.exitCode = exitCode;
		this.details = details;
		this.name = "CliError";
	}
}

export function statusFrom(error: CliError): number | undefined {
	const details = error.details;
	if (typeof details !== "object" || details === null || !("status" in details))
		return undefined;
	const status = details.status;
	return typeof status === "number" ? status : undefined;
}

export function toCliError(error: unknown): CliError {
	if (error instanceof CliError) {
		return error;
	}

	if (error instanceof Error) {
		return new CliError(error.message);
	}

	return new CliError("An unexpected error occurred.");
}
