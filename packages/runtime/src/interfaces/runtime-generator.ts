import type { Query, Chunk } from "@rag-sdk/core";
import type { GenerationResult } from "../types/generation-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";

/**
 * 运行时生成器接口
 *
 * 负责生成阶段：基于最终上下文生成回答
 */
export interface RuntimeGenerator {
  generate(
    input: {
      query: Query;
      chunks: Chunk[];
      promptContext?: string;
    },
    context: RuntimeContext
  ): Promise<GenerationResult>;
}
