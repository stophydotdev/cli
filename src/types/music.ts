import type { EmptyState, OutputOptions, Thumbnail } from "./api.js";

export type MusicSearchType =
	| "song"
	| "video"
	| "album"
	| "artist"
	| "playlist"
	| "podcast"
	| "episode"
	| "profile";

export interface MusicSearchOptions extends OutputOptions {
	q: string;
	type?: MusicSearchType;
	continuationToken?: string;
}

export interface MusicSuggestOptions extends OutputOptions {
	q: string;
}

export interface MusicSongOptions extends OutputOptions {
	url: string;
}

export interface MusicLyricsOptions extends OutputOptions {
	url: string;
}

export interface MusicAlbumOptions extends OutputOptions {
	url: string;
}

export interface MusicArtistOptions extends OutputOptions {
	url: string;
}

export interface MusicPlaylistOptions extends OutputOptions {
	url: string;
	continuationToken?: string;
}

export interface MusicArtistRef {
	id: string | null;
	name: string;
}

export interface MusicAlbumRef {
	id: string | null;
	name: string;
}

export interface MusicItem {
	type: MusicSearchType;
	id: string | null;
	url: string | null;
	videoUrl?: string | null;
	playlistUrl?: string | null;
	channelUrl?: string | null;
	albumUrl?: string | null;
	artistUrl?: string | null;
	title: string;
	author: string | null;
	authorId: string | null;
	album: MusicAlbumRef | null;
	artists: MusicArtistRef[];
	duration: string | null;
	durationSec: number | null;
	durationText: string | null;
	isExplicit: boolean;
	plays: string | null;
	thumbnails: Thumbnail[];
}

export interface MusicSong extends Omit<MusicItem, "id" | "url"> {
	id: string;
	url: string;
	videoUrl: string;
	lyricsBrowseId: string | null;
	relatedBrowseId: string | null;
}

export interface MusicSearchData {
	items: MusicItem[];
	continuationToken: string | null;
	hasMore: boolean;
	empty?: EmptyState | null;
}

export interface MusicSuggestData {
	q: string;
	suggestions: string[];
}

export type MusicSongData = { song: MusicSong } | { empty: EmptyState };

export interface MusicLyricsData {
	videoId: string;
	videoUrl: string;
	lyrics: string | null;
	source: string | null;
	hasTimedLyrics: boolean;
	empty?: EmptyState | null;
}

export interface MusicAlbumData {
	album: {
		id: string;
		url: string | null;
		albumUrl: string | null;
		title: string;
		artists: MusicArtistRef[];
		year: string | null;
		trackCountText: string | null;
		durationText: string | null;
		thumbnails: Thumbnail[];
	};
	items: MusicItem[];
	empty?: EmptyState | null;
}

export interface MusicArtistData {
	artist: {
		id: string | null;
		url: string | null;
		channelUrl: string | null;
		name: string;
		description: string | null;
		subscriberText: string | null;
		thumbnails: Thumbnail[];
	};
	sections: Array<{
		title: string;
		items: Array<{
			id: string | null;
			url: string | null;
			videoUrl?: string;
			channelUrl?: string;
			kind: "watch" | "browse";
			title: string;
			subtitle: string | null;
			thumbnails: Thumbnail[];
		}>;
	}>;
	empty?: EmptyState | null;
}

export interface MusicPlaylistData {
	playlist: {
		id: string | null;
		url: string | null;
		playlistUrl: string | null;
		title: string;
		subtitle: string | null;
		trackCountText: string | null;
		durationText: string | null;
		thumbnails: Thumbnail[];
	};
	items: MusicItem[];
	continuationToken: string | null;
	hasMore: boolean;
	empty?: EmptyState | null;
}
