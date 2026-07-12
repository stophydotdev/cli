import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export type ChannelTab =
	| "video"
	| "short"
	| "live"
	| "playlist"
	| "post"
	| "community"
	| "course"
	| "about";
export type ChannelSortBy = "latest" | "popular" | "oldest";

export interface ChannelOptions extends OutputOptions {
	url: string;
	query?: string;
	tab?: ChannelTab;
	sortBy?: ChannelSortBy;
	continuationToken?: string;
}

export interface ChannelLink {
	title: string;
	url: string;
}

export interface ChannelProfile {
	type: "channel";
	id: string | null;
	url: string | null;
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
	country: string | null;
	joinedDate: string | null;
	viewCount: number | null;
	viewCountText: string | null;
	links: ChannelLink[] | null;
}

export interface ChannelVideoItem {
	id: string;
	type: "video";
	url: string;
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
	url: string;
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
	url: string;
	playlistUrl: string;
	title: string | null;
	author: string | null;
	authorId: string | null;
	videoCount: number | null;
	videoCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface ChannelPostItem {
	id: string;
	type: "post";
	url: string;
	content: string | null;
	publishedTimeText: string | null;
	likeCountText: string | null;
	commentCountText: string | null;
	images: Array<{ thumbnails: Thumbnail[] }>;
	video: { id: string; title: string | null; url: string } | null;
}

export interface ChannelCourseItem extends Omit<ChannelPlaylistItem, "type"> {
	type: "course";
	courseUrl: string;
}

export type ChannelItem =
	| ChannelVideoItem
	| ChannelShortItem
	| ChannelPlaylistItem
	| ChannelCourseItem
	| ChannelPostItem;

export interface ChannelData {
	channel: ChannelProfile | null;
	tab: string;
	items: ChannelItem[];
	continuationToken: string | null;
	hasMore: boolean;
	empty?: EmptyState | null;
}
