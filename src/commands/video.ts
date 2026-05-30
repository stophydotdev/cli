import type { Command } from "commander";
import { request } from "../client";
import { CliError } from "../errors";
import { printJson } from "../output";

export function registerVideoCommands(program: Command) {
	const video = program
		.command("video")
		.description("Get video details, transcript, comments, or replies");

	video
		.command("details")
		.description("Get metadata for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy video details --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video details --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.title'
`)
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/video",
				body: { videoUrl: options.url, type: "details" },
			});
			printJson(result.body);
		});

	video
		.command("transcript")
		.description("Get the transcript/captions for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy video transcript --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video transcript --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.transcript'
`)
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/video",
				body: { videoUrl: options.url, type: "transcript" },
			});
			printJson(result.body);
		});

	video
		.command("comments")
		.description("Get comments for a YouTube video")
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--sortBy <sortBy>", "top or latest")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4"
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --sortBy top
  $ stophy video comments --url "https://www.youtube.com/watch?v=h6ukrWyqOm4" --json | jq '.data.comments[0].text'
`)
		.action(async (options) => {
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/video",
				body: {
					videoUrl: options.url,
					type: "comments",
					sortBy: options.sortBy,
					continuationToken: options.continuationToken,
				},
			});
			printJson(result.body);
		});

	video
		.command("replies")
		.description("Get replies to a comment using a continuation token")
		.requiredOption("--continuation-token <token>", "Reply continuation token")
		.option("--json", "Print raw JSON")
		.addHelpText("after", `
Examples:
  $ stophy video replies --continuation-token "<token from comments response>"
`)
		.action(async (options) => {
			if (!options.continuationToken?.trim()) {
				throw new CliError("`--continuation-token` is required.");
			}
			const result = await request<Record<string, unknown>>({
				method: "POST",
				path: "/v1/video",
				body: { type: "replies", continuationToken: options.continuationToken },
			});
			printJson(result.body);
		});
}
