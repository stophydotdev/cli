export type ApiCacheState = "hit" | "miss";

export interface ApiSuccess<T> {
	success: true;
	data: T;
	requestId: string;
	cacheState?: ApiCacheState;
	creditsUsed?: number;
	creditsRemaining?: number;
}

export interface ApiFailure {
	success: false;
	error: string;
	code?: string;
	details?: unknown;
}

export interface Thumbnail {
	url: string;
	width: number;
	height: number;
}

export interface EmptyState {
	code: string;
	message: string;
}

export interface OutputOptions {
	json?: boolean;
	output?: string;
}
