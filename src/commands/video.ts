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
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--json", "Print raw JSON")
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
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--json", "Print raw JSON")
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
		.requiredOption("--url <url>", "YouTube video URL")
		.option("--sortBy <sortBy>", "top or latest")
		.option("--continuation-token <token>")
		.option("--json", "Print raw JSON")
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
		.requiredOption("--continuation-token <token>", "Reply continuation token")
		.option("--json", "Print raw JSON")
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
