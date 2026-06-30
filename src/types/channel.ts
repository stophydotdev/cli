import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export type ChannelTab = "video" | "short" | "playlist" | "about";
export type ChannelSortBy = "latest" | "popular" | "oldest";

export interface ChannelOptions extends OutputOptions {
	url: string;
	tab?: ChannelTab;
	sortBy?: ChannelSortBy;
	continuationToken?: string;
}

export interface ChannelLink {
	title: string;
	url: string;
}

export interface ChannelProfile {
	id: string | null;
	name: string | null;
	handle: string | null;
	channelUrl: string | null;
	description: string | null;
	subscriberCount: number | null;
	subscriberCountText: string | null;
	videoCount: number | null;
	videoCountText: string | null;
	isVerified: boolean;
	thumbnails: Thumbnail[];
	banners: Thumbnail[];
	// About-tab only: present when fetching `--tab about`, omitted on other tabs.
	country?: string;
	joinedDate?: string;
	viewCount?: number;
	viewCountText?: string;
	links?: ChannelLink[];
}

export interface ChannelVideoItem {
	id: string;
	type: "video";
	videoUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	duration: string | null;
	durationSec: number | null;
	durationText: string | null;
	isLive: boolean;
	isUpcoming: boolean;
	upcomingAt: string | null;
	viewCount: number | null;
	viewCountText: string | null;
	publishedAt: string | null;
	publishedAtText: string | null;
	thumbnails: Thumbnail[];
}

export interface ChannelShortItem {
	id: string;
	type: "short";
	shortUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	viewCount: number | null;
	viewCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface ChannelPlaylistItem {
	id: string;
	type: "playlist";
	playlistUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	videoCount: string | null;
	thumbnails: Thumbnail[];
}

export type ChannelItem =
	| ChannelVideoItem
	| ChannelShortItem
	| ChannelPlaylistItem;

export interface ChannelData {
	channel: ChannelProfile | null;
	tab?: string;
	items?: ChannelItem[];
	continuationToken?: string | null;
	empty?: EmptyState;
}
