import type { QueryPreprocessor } from "../interfaces/query-preprocessor.js";
import type { RuntimeRetriever } from "../interfaces/runtime-retriever.js";
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js";
import type { RuntimeGenerator } from "../interfaces/runtime-generator.js";
import type { RuntimeInput } from "../types/runtime-input.js";
import type { RuntimeResult } from "../types/runtime-result.js";
import { runPipeline } from "./run-runtime.js";

export type RuntimeOptions = {
  preprocessor: QueryPreprocessor;
  retriever: RuntimeRetriever;
  postprocessor: RetrievalPostprocessor;
  generator: RuntimeGenerator;
};

export type Runtime = {
  run(input: RuntimeInput): Promise<RuntimeResult>;
};

/**
 * 创建运行时实例
 *
 * 将四阶段组件组合成一个稳定可复用的 runtime 对象。
 */
export function createRuntime(options: RuntimeOptions): Runtime {
  const { preprocessor, retriever, postprocessor, generator } = options;

  return {
    async run(input: RuntimeInput): Promise<RuntimeResult> {
      return runPipeline(input, {
        preprocessor,
        retriever,
        postprocessor,
        generator,
      });
    },
  };
}
