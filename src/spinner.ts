import ora, { type Ora } from "ora";

export interface Spinner {
	start: (message?: string) => void;
	update: (message: string) => void;
	stop: (finalMessage?: string) => void;
	succeed: (message?: string) => void;
	fail: (message?: string) => void;
}

export function createSpinner(initialMessage = ""): Spinner {
	const spinner: Ora = ora({ text: initialMessage, stream: process.stderr });

	return {
		start(message?: string) {
			if (message) spinner.text = message;
			spinner.start();
		},
		update(message: string) {
			spinner.text = message;
		},
		stop(finalMessage?: string) {
			spinner.stop();
			if (finalMessage) process.stderr.write(`${finalMessage}\n`);
		},
		succeed(message?: string) {
			spinner.succeed(message);
		},
		fail(message?: string) {
			spinner.fail(message);
		},
	};
}

export async function withSpinner<T>(
	message: string,
	task: () => Promise<T>,
): Promise<T> {
	const spinner = createSpinner(message);
	spinner.start();
	try {
		const result = await task();
		spinner.stop();
		return result;
	} catch (error) {
		spinner.fail();
		throw error;
	}
}
