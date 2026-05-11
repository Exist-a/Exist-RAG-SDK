import { z } from "zod";
import { ChunkSchema } from "./chunk.js";

/**
 * RAGResponse 校验规则
 */
export const RAGResponseSchema = z.object({
  answer: z.string(),
  chunks: z.array(ChunkSchema),
});
