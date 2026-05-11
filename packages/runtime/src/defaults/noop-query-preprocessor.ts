import type { Query } from "@rag-sdk/core";
import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js";
import type { PreRetrievalResult } from "../types/pre-retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";

/**
 * 空操作查询预处理器
 *
 * 不改写 query，只补默认 retrieval 参数。
 */
export class NoopQueryPreprocessor implements QueryPreprocessor {
  async preprocess(
    query: Query,
    _context: RuntimeContext
  ): Promise<PreRetrievalResult> {
    return {
      effectiveQuery: query,
      topK: 5,
    };
  }
}
