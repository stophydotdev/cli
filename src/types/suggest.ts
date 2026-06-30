import type { OutputOptions } from "./api.js";

export interface SuggestOptions extends OutputOptions {
	q: string;
	hl?: string;
	gl?: string;
}

export interface SuggestData {
	q: string;
	hl: string;
	gl: string;
	suggestions: string[];
}
