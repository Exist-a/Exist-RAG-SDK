import type { Query } from "../types/query.js";
import type { Chunk } from "../types/chunk.js";

/**
 * 生成器接口
 */
export interface Generator {
  generate(input: {
    query: Query;
    chunks: Chunk[];
  }): Promise<string>;
}
