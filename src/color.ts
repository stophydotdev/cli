const ANSI_GREEN = "\x1b[32m";
const ANSI_RESET = "\x1b[0m";

export function green(text: string) {
	return process.stdout.isTTY ? `${ANSI_GREEN}${text}${ANSI_RESET}` : text;
}
