import updateNotifier from "update-notifier";
import packageJson from "../package.json" with { type: "json" };

const INSTALL_COMMAND = "npm install -g @stophy/cli";
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 20;

function updateCheckDisabled(): boolean {
	const value = process.env.STOPHY_NO_UPDATE_CHECK;
	return value === "1" || value === "true";
}

export async function maybeShowUpdateNotice(): Promise<void> {
	if (updateCheckDisabled() || !process.stderr.isTTY) return;

	try {
		const notifier = updateNotifier({
			pkg: { name: packageJson.name, version: packageJson.version },
			updateCheckInterval: CHECK_INTERVAL_MS,
		});

		if (!notifier.update) return;

		notifier.notify({
			defer: false,
			isGlobal: true,
			message: `Update available ${notifier.update.current} → ${notifier.update.latest}\nRun ${INSTALL_COMMAND} to update.`,
		});
	} catch {
		// never let the update check interfere with a command
	}
}
