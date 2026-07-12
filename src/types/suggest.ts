import type { OutputOptions } from "./api.js";

export interface SuggestOptions extends OutputOptions {
	q: string;
	hl?: string;
	gl?: string;
}

export interface SuggestData {
	suggestions: string[];
}
