import { z } from "zod";

/** JSON envelope returned by `POST /v1/<source>/<endpoint>`. */
export const successEnvelope = z.object({
	success: z.literal(true),
	data: z.unknown(),
	creditsUsed: z.number().int().nonnegative(),
	requestId: z.string(),
});

export type SuccessEnvelope = z.infer<typeof successEnvelope>;

export interface OutputOptions {
	json?: boolean;
	output?: string;
}
