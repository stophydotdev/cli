import type { Command } from "commander";
import { request } from "../client.js";
import { CliError } from "../errors.js";
import { handleOutput } from "../output.js";
import { withSpinner } from "../spinner.js";
import type {
	CommentsData,
	LiveChatData,
	RepliesData,
	TranscriptData,
	VideoCommentsOptions,
	VideoDetailsData,
	VideoDetailsOptions,
	VideoLiveChatOptions,
	VideoRepliesOptions,
	VideoTranscriptOptions,
} from "../types/video.js";

export function registerVideoCommands(program: Command) {
	const video = program
		.command("video")
		.description(
			"Get video details, transcripts, comments, replies, or live chat",
		);

	video
		.command("details")
		.description("Get metadata for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy video details --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video details --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.video.title'
`,
		)
		.action(async (options: VideoDetailsOptions) => {
			const result = await withSpinner("Fetching video details…", () =>
				request<VideoDetailsData>({
					method: "POST",
					path: "/v1/video",
					body: { videoUrl: options.url, type: "details" },
				}),
			);
			handleOutput(result.body, options);
		});

	video
		.command("transcript")
		.description("Get the transcript for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--lang <lang>", "Transcript language code, e.g. en")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy video transcript --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video transcript --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.segments[].text'
`,
		)
		.action(async (options: VideoTranscriptOptions) => {
			const result = await withSpinner("Fetching transcript…", () =>
				request<TranscriptData>({
					method: "POST",
					path: "/v1/video",
					body: {
						videoUrl: options.url,
						type: "transcript",
						lang: options.lang,
					},
				}),
			);
			handleOutput(result.body, options);
		});

	video
		.command("comments")
		.description("Get comments for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--sortBy <sortBy>", "top, latest, or any")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --sortBy top
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.items[0].text'
`,
		)
		.action(async (options: VideoCommentsOptions) => {
			const result = await withSpinner("Fetching comments…", () =>
				request<CommentsData>({
					method: "POST",
					path: "/v1/video",
					body: {
						videoUrl: options.url,
						type: "comments",
						sortBy: options.sortBy,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});

	video
		.command("replies")
		.description("Get replies to a comment using a continuation token")
		.requiredOption("--continuation-token <token>", "Reply continuation token")
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy video replies --continuation-token "<token from comments response>"
`,
		)
		.action(async (options: VideoRepliesOptions) => {
			if (!options.continuationToken?.trim()) {
				throw new CliError("`--continuation-token` is required.");
			}
			const result = await withSpinner("Fetching replies…", () =>
				request<RepliesData>({
					method: "POST",
					path: "/v1/video",
					body: {
						type: "replies",
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});

	video
		.command("livechat")
		.description("Get live chat messages and status for a YouTube live stream")
		.requiredOption("--url <url>", "YouTube video URL")
		.option(
			"--chatType <chatType>",
			"top (moderated, default) or live (all messages)",
		)
		.option(
			"--continuation-token <token>",
			"Poll token from a previous livechat response (fetches only new messages)",
		)
		.option("--json", "Print raw JSON")
		.option("-o, --output <file>", "Write output to a file")
		.addHelpText(
			"after",
			`
Examples:
  $ stophy video livechat --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video livechat --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --chatType live
  $ stophy video livechat --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --continuation-token "<token from a previous livechat response>"
`,
		)
		.action(async (options: VideoLiveChatOptions) => {
			const result = await withSpinner("Fetching live chat…", () =>
				request<LiveChatData>({
					method: "POST",
					path: "/v1/video",
					body: {
						videoUrl: options.url,
						type: "livechat",
						chatType: options.chatType,
						continuationToken: options.continuationToken,
					},
				}),
			);
			handleOutput(result.body, options);
		});
}
