import type { Chunk } from "@rag-sdk/core";
import type { Vector } from "../types/vector.js";

/**
 * 嵌入器接口
 */
export interface Embedder {
  embed(chunks: Chunk[]): Promise<Vector[]>;
}
