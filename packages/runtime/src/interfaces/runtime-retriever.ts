import type { Query } from "@rag-sdk/core";
import type { RetrievalResult } from "../types/retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";

/**
 * 运行时检索器接口
 *
 * 负责检索阶段：基于有效查询执行召回
 */
export interface RuntimeRetriever {
  retrieve(query: Query, context: RuntimeContext): Promise<RetrievalResult>;
}
