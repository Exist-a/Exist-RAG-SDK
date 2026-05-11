import { z } from "zod";

/**
 * Chunk 校验规则
 */
export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});
