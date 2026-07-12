import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export type SearchType = "video" | "short" | "channel" | "playlist" | "movie";
export type SearchSortBy = "relevance" | "popularity" | "date" | "rating";
export type SearchUploadDate = "today" | "week" | "month" | "year";
export type SearchDuration = "short" | "medium" | "long";

export interface SearchOptions extends OutputOptions {
	q: string;
	type?: SearchType;
	sortBy?: SearchSortBy;
	uploadDate?: SearchUploadDate;
	duration?: SearchDuration;
	features?: string;
	continuationToken?: string;
}

export interface SearchVideo {
	type: "video";
	id: string;
	url: string;
	videoUrl: string;
	title: string;
	author: string | null;
	authorId: string | null;
	description: string | null;
	duration: string | null;
	durationSec: number | null;
	durationText: string | null;
	isLive: boolean;
	isUpcoming: boolean;
	isVerified: boolean;
	viewCount: number | null;
	viewCountText: string | null;
	publishedAt: string | null;
	publishedAtText: string | null;
	thumbnails: Thumbnail[];
}

export interface SearchShort {
	type: "short";
	id: string;
	url: string;
	shortUrl: string;
	title: string;
	viewCount: number | null;
	viewCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface SearchPlaylist {
	type: "playlist";
	id: string;
	url: string;
	playlistUrl: string;
	title: string;
	author: string | null;
	authorId: string | null;
	videoCount: number | null;
	videoCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface SearchChannel {
	type: "channel";
	id: string;
	url: string;
	channelUrl: string;
	name: string;
	handle: string | null;
	description: string | null;
	subscriberCount: number | null;
	subscriberCountText: string | null;
	isVerified: boolean;
	thumbnails: Thumbnail[];
}

export type SearchItem =
	| SearchVideo
	| SearchShort
	| SearchPlaylist
	| SearchChannel;

export interface SearchData {
	items: SearchItem[];
	continuationToken: string | null;
	hasMore: boolean;
	estimatedResults: number | null;
	empty?: EmptyState | null;
}
