import type { Query } from "@rag-sdk/core";
import type { PreRetrievalResult } from "../types/pre-retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";

/**
 * 查询预处理器接口
 *
 * 负责检索前处理阶段：规范化、改写、路由、参数决策
 */
export interface QueryPreprocessor {
  preprocess(query: Query, context: RuntimeContext): Promise<PreRetrievalResult>;
}
