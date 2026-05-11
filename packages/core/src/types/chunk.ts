import { z } from "zod";
import { ChunkSchema } from "../spec/chunk.js";

/**
 * Chunk 类型
 */
export type Chunk = z.infer<typeof ChunkSchema>;
