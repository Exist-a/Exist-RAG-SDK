import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js";
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js";
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js";
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js";
import type { RuntimeInput } from "../types/runtime-input.js";
import type { RuntimeResult } from "../types/runtime-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";
import type { PostRetrievalDebug } from "../types/selection-trace.js";
import { RuntimeError } from "../errors/runtime-error.js";
import { getErrorCause } from "@rag-sdk/utils";

export type PipelineComponents = {
  preprocessor: QueryPreprocessor;
  retriever: RuntimeRetriever;
  postprocessor: RetrievalPostprocessor;
  generator: RuntimeGenerator;
};

/**
 * 执行运行时四阶段流水线
 *
 * pre-retrieval → retrieval → post-retrieval → generation
 */
export async function runPipeline(
  input: RuntimeInput,
  components: PipelineComponents
): Promise<RuntimeResult> {
  const context: RuntimeContext = {};
  const originalQuery = input.query.query;

  // Stage 1: pre-retrieval
  const preResult = await runStage(
    "pre-retrieval",
    originalQuery,
    () => components.preprocessor.preprocess(input.query, context)
  );

  // Stage 2: retrieval
  const retrievalResult = await runStage(
    "retrieval",
    originalQuery,
    () =>
      components.retriever.retrieve(preResult.effectiveQuery, context)
  );

  // Stage 3: post-retrieval
  const postResult = await runStage(
    "post-retrieval",
    originalQuery,
    () =>
      components.postprocessor.postprocess(
        preResult.effectiveQuery,
        retrievalResult.chunks,
        context
      )
  );

  // Stage 4: generation
  const generationResult = await runStage(
    "generation",
    originalQuery,
    () =>
      components.generator.generate(
        {
          query: preResult.effectiveQuery,
          chunks: postResult.chunks,
          promptContext: postResult.promptContext,
        },
        context
      )
  );

  // 组装 post-retrieval 调试信息
  const selectedCount = postResult.selectedCandidates?.length ?? postResult.chunks.length;
  const droppedCount = postResult.droppedCandidates?.length ?? 0;
  const totalCandidates = selectedCount + droppedCount;

  const postRetrievalDebug: PostRetrievalDebug | undefined =
    postResult.selectedCandidates || postResult.droppedCandidates || postResult.selectionTrace
      ? {
          totalCandidates,
          selectedCount,
          droppedCount,
          appliedScoreThreshold: postResult.appliedScoreThreshold,
          appliedBudget: postResult.appliedBudget,
          selectionTrace: postResult.selectionTrace,
          droppedCandidates: postResult.droppedCandidates?.map((dc) => ({
            candidateId: dc.candidate.id,
            reason: dc.reason,
            stage: dc.stage,
          })),
        }
      : undefined;

  return {
    answer: generationResult.answer,
    chunks: postResult.chunks,
    originalQuery,
    effectiveQuery: preResult.effectiveQuery.query,
    retrievedCount: retrievalResult.chunks.length,
    finalChunkCount: postResult.chunks.length,
    promptContext: postResult.promptContext,
    retrievalMetadata: retrievalResult.metadata,
    postRetrievalMetadata: postResult.metadata,
    generationMetadata: generationResult.metadata,
    postRetrievalDebug,
  };
}

async function runStage<T>(
  stage: "pre-retrieval" | "retrieval" | "post-retrieval" | "generation",
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new RuntimeError(
      `运行时阶段 "${stage}" 失败: ${error}`,
      stage,
      query,
      getErrorCause(error)
    );
  }
}
