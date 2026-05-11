import type { Query, Chunk } from "@rag-sdk/core";
import type { PostRetrievalResult } from "../types/post-retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";

/**
 * 检索后处理器接口
 *
 * 负责检索后处理阶段：去重、过滤、rerank、trim、context 组装
 */
export interface RetrievalPostprocessor {
  postprocess(
    query: Query,
    chunks: Chunk[],
    context: RuntimeContext
  ): Promise<PostRetrievalResult>;
}
