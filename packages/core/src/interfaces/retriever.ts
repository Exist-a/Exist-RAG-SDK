import type { Query } from "../types/query.js";
import type { Chunk } from "../types/chunk.js";

/**
 * 检索器接口
 */
export interface Retriever {
  retrieve(query: Query): Promise<Chunk[]>;
}
