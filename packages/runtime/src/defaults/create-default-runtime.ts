import { createRuntime } from "../pipeline/create-runtime.js";
import { NoopQueryPreprocessor } from "./noop-query-preprocessor.js";
import { PassthroughRetrievalPostprocessor } from "./passthrough-postprocessor.js";
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js";
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js";
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js";

export type CreateDefaultRuntimeOptions = {
  retriever: RuntimeRetriever;
  generator: RuntimeGenerator;
  /** 可选的自定义 postprocessor，默认为 PassthroughRetrievalPostprocessor */
  postprocessor?: RetrievalPostprocessor;
};

/**
 * 创建默认运行时
 *
 * 使用默认空实现快速组装一个最小可运行的 runtime。
 */
export function createDefaultRuntime(options: CreateDefaultRuntimeOptions) {
  return createRuntime({
    preprocessor: new NoopQueryPreprocessor(),
    retriever: options.retriever,
    postprocessor: options.postprocessor ?? new PassthroughRetrievalPostprocessor(),
    generator: options.generator,
  });
}
