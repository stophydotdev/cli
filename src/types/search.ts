import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export type SearchType = "video" | "channel" | "playlist";
export type SearchSortBy = "relevance" | "uploadDate" | "viewCount" | "rating";
export type SearchUploadDate = "hour" | "today" | "week" | "month" | "year";
export type SearchDuration = "short" | "medium" | "long";

export interface SearchOptions extends OutputOptions {
	q: string;
	type?: SearchType;
	sortBy?: SearchSortBy;
	uploadDate?: SearchUploadDate;
	duration?: SearchDuration;
	continuationToken?: string;
}

export interface SearchVideo {
	type: "video";
	id: string;
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
	shortUrl: string;
	title: string;
	viewCount: number | null;
	viewCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface SearchPlaylist {
	type: "playlist";
	id: string;
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

export interface SearchQueryEcho {
	q: string;
	type?: SearchType;
	sortBy?: SearchSortBy;
	uploadDate?: SearchUploadDate;
	duration?: SearchDuration;
	features?: string[];
}

export interface SearchData {
	query: SearchQueryEcho;
	items: SearchItem[];
	continuationToken: string | null;
	estimatedResults?: number;
	empty?: EmptyState;
}
