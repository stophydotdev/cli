import { expect, test } from "bun:test";
import { formatBalance } from "../src/account.ts";

test("a balance with a partial credit shows whole credits, rounded down", () => {
	expect(formatBalance(59_601_000)).toBe("29,800 credits ($59.60)");
});

test("a balance of whole credits shows them exactly", () => {
	expect(formatBalance(2_000_000)).toBe("1,000 credits ($2.00)");
});
