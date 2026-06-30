import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export interface PlaylistOptions extends OutputOptions {
	url: string;
	continuationToken?: string;
}

export interface PlaylistInfo {
	id: string;
	type: "playlist";
	playlistUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	description: string | null;
	videoCount: string | null;
	thumbnails: Thumbnail[];
}

export interface PlaylistItem {
	id: string;
	type: "video";
	videoUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	duration: string | null;
	durationSec: number | null;
	durationText: string | null;
	index: number | null;
	isLive: boolean;
	isPlayable: boolean;
	isUpcoming: boolean;
	upcomingAt: string | null;
	viewCount: number | null;
	viewCountText: string | null;
	publishedAt: string | null;
	publishedAtText: string | null;
	thumbnails: Thumbnail[];
}

export interface PlaylistData {
	playlist: PlaylistInfo | null;
	items: PlaylistItem[];
	continuationToken: string | null;
	empty?: EmptyState;
}
