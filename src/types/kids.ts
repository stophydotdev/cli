import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export interface KidsSearchOptions extends OutputOptions {
	q: string;
	continuationToken?: string;
}

export interface KidsVideoOptions extends OutputOptions {
	url: string;
}

export interface KidsVideoItem {
	type: "video";
	id: string;
	url: string;
	videoUrl: string;
	kidsUrl: string;
	title: string;
	author: string | null;
	authorId: string | null;
	authorUrl: string | null;
	duration: string | null;
	durationSec: number | null;
	durationText: string | null;
	publishedAt: string | null;
	publishedAtText: string | null;
	viewCount: number | null;
	viewCountText: string | null;
	thumbnails: Thumbnail[];
}

export interface KidsVideoDetails extends KidsVideoItem {
	description: string | null;
	isLive: boolean;
	isLiveContent: boolean;
	keywords: string[];
}

export interface KidsSearchData {
	items: KidsVideoItem[];
	continuationToken: string | null;
	hasMore: boolean;
	empty?: EmptyState | null;
}

export type KidsVideoData =
	| {
			video: KidsVideoDetails;
			related: KidsVideoItem[];
	  }
	| { empty: EmptyState };
