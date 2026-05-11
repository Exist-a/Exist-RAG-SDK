import {
  DefaultRetrievalPostprocessor,
  type DefaultPostprocessorOptions,
} from "./default-postprocessor.js";

/**
 * 创建默认检索后处理器
 *
 * 通过轻量配置组合多种 post-retrieval 策略，无需自定义实现 RetrievalPostprocessor。
 *
 * @example
 * ```ts
 * const postprocessor = createDefaultPostprocessor({
 *   scoreThreshold: 0.65,
 *   budget: { maxCandidates: 8 },
 *   nearDuplicate: true,
 *   sourceCoverage: { maxPerSource: 2 },
 *   debug: true,
 * });
 * ```
 */
export function createDefaultPostprocessor(
  options?: DefaultPostprocessorOptions
): DefaultRetrievalPostprocessor {
  return new DefaultRetrievalPostprocessor(options);
}

export type { DefaultPostprocessorOptions };
