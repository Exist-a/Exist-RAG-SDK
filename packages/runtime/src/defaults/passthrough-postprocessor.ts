import type { Query, Chunk } from "@rag-sdk/core";
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js";
import type { PostRetrievalResult } from "../types/post-retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";
import { buildPromptContext } from "@rag-sdk/utils";

/**
 * 透传检索后处理器
 *
 * 不 rerank、不 trim，直接透传 chunks。
 */
export class PassthroughRetrievalPostprocessor implements RetrievalPostprocessor {
  async postprocess(
    _query: Query,
    chunks: Chunk[],
    _context: RuntimeContext
  ): Promise<PostRetrievalResult> {
    return {
      chunks,
      promptContext: buildPromptContext(chunks),
    };
  }
}
