import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type {
	MusicAlbumData,
	MusicAlbumOptions,
	MusicArtistData,
	MusicArtistOptions,
	MusicLyricsData,
	MusicLyricsOptions,
	MusicPlaylistData,
	MusicPlaylistOptions,
	MusicSearchData,
	MusicSearchOptions,
	MusicSongData,
	MusicSongOptions,
	MusicSuggestData,
	MusicSuggestOptions,
} from "../types/music.js";

export function registerMusicCommands(program: Command) {
	const music = program
		.command("music")
		.description("Search YouTube Music or fetch music resources");

	music
		.command("search")
		.description("Search YouTube Music")
		.requiredOption("--q <query>", "Search query")
		.option(
			"--type <type>",
			"song, video, album, artist, playlist, podcast, episode, or profile",
		)
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy music search --q "lofi" --type song
  $ stophy music search --q "kendrick" --type album --json
`,
		)
		.action(async (options: MusicSearchOptions) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const result = await withSpinner("Searching YouTube Music…", () =>
				request<MusicSearchData>({
					method: "POST",
					path: "/v1/music",
					body: {
						type: "search",
						q: options.q,
						searchType: options.type,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("suggest")
		.description("Get YouTube Music autocomplete suggestions")
		.requiredOption("--q <query>", "Partial search query")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicSuggestOptions) => {
			if (!options.q?.trim()) {
				throw new CliError("`--q` is required.");
			}
			const result = await withSpinner("Fetching music suggestions…", () =>
				request<MusicSuggestData>({
					method: "POST",
					path: "/v1/music",
					body: { type: "suggest", q: options.q },
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("song")
		.description("Get YouTube Music song metadata")
		.requiredOption("--url <url>", "YouTube or YouTube Music video URL or ID")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicSongOptions) => {
			const result = await withSpinner("Fetching song…", () =>
				request<MusicSongData>({
					method: "POST",
					path: "/v1/music",
					body: { type: "song", videoUrl: options.url },
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("lyrics")
		.description("Get lyrics for a YouTube Music song")
		.requiredOption("--url <url>", "YouTube or YouTube Music video URL or ID")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicLyricsOptions) => {
			const result = await withSpinner("Fetching lyrics…", () =>
				request<MusicLyricsData>({
					method: "POST",
					path: "/v1/music",
					body: { type: "lyrics", videoUrl: options.url },
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("album")
		.description("Get YouTube Music album metadata and tracks")
		.requiredOption("--url <url>", "YouTube Music album URL or ID")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicAlbumOptions) => {
			const result = await withSpinner("Fetching album…", () =>
				request<MusicAlbumData>({
					method: "POST",
					path: "/v1/music",
					body: { type: "album", albumUrl: options.url },
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("artist")
		.description("Get YouTube Music artist metadata and sections")
		.requiredOption("--url <url>", "YouTube Music artist URL or ID")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicArtistOptions) => {
			const result = await withSpinner("Fetching artist…", () =>
				request<MusicArtistData>({
					method: "POST",
					path: "/v1/music",
					body: { type: "artist", artistUrl: options.url },
				}),
			);
			handleOutput(result.body, options);
		});

	music
		.command("playlist")
		.description("Get YouTube Music playlist tracks")
		.requiredOption("--url <url>", "YouTube Music playlist URL or ID")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.action(async (options: MusicPlaylistOptions) => {
			const result = await withSpinner("Fetching music playlist…", () =>
				request<MusicPlaylistData>({
					method: "POST",
					path: "/v1/music",
					body: {
						type: "playlist",
						playlistUrl: options.url,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});
}
