import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export interface PlaylistOptions extends OutputOptions {
	url: string;
	continuationToken?: string;
}

export interface PlaylistInfo {
	id: string;
	type: "playlist";
	url: string;
	playlistUrl: string;
	title: string;
	author: string | null;
	authorId: string | null;
	description: string | null;
	videoCount: number | null;
	videoCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface PlaylistItem {
	id: string;
	type: "video";
	url: string;
	videoUrl: string;
	title: string;
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
	hasMore: boolean;
	empty?: EmptyState | null;
}
