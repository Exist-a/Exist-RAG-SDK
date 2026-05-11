import type { Vector } from "../types/vector.js";

/**
 * 向量存储接口
 */
export interface VectorStore {
  upsert(vectors: Vector[]): Promise<void>;
}
