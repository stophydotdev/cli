import { createHash } from "node:crypto";
import { hostname } from "node:os";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function loginCode(codeChallenge: string): string {
	const bytes = createHash("sha256").update(codeChallenge, "utf8").digest();
	let bits = 0n;
	for (const byte of bytes.subarray(0, 5)) bits = (bits << 8n) | BigInt(byte);
	let code = "";
	for (let shift = 35n; shift >= 0n; shift -= 5n) {
		code += CROCKFORD[Number((bits >> shift) & 31n)];
	}
	return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function deviceName(raw: string = hostname()): string | undefined {
	const cleaned = raw
		.replace(/\s+/gu, " ")
		.replace(/[^\p{L}\p{N} ._'-]/gu, "")
		.replace(/ +/gu, " ")
		.trim()
		.slice(0, 64)
		.trim();
	return cleaned.length === 0 ? undefined : cleaned;
}
