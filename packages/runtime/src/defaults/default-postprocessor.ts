import type { Query, Chunk } from "@rag-sdk/core";
import type { RetrievalPostprocessor } from "../interfaces/retrieval-postprocessor.js";
import type { PostRetrievalResult } from "../types/post-retrieval-result.js";
import type { RuntimeContext } from "../types/runtime-context.js";
import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";
import { buildPromptContext } from "@rag-sdk/utils";
import type {
  BudgetConfig,
  CandidatePredicate,
  NearDuplicateOptions,
  SourceCoverageOptions,
  CandidateComparator,
} from "../strategies/index.js";
import {
  applyScoreThreshold,
  applyBudgetTrim,
  applyCustomPredicate,
  applyNearDuplicateRemoval,
  applySourceCoverage,
  orderCandidates,
  scoreComparator,
} from "../strategies/index.js";

/**
 * 默认检索后处理器配置选项
 */
export type DefaultPostprocessorOptions = {
  /** 分数阈值，低于此值的候选将被过滤 */
  scoreThreshold?: number;
  /** 预算限制配置 */
  budget?: BudgetConfig;
  /** 自定义谓词过滤函数 */
  customPredicate?: CandidatePredicate;
  /** 是否启用近似去重，或传入自定义选项 */
  nearDuplicate?: boolean | NearDuplicateOptions;
  /** 是否启用来源覆盖率限制，或传入自定义选项 */
  sourceCoverage?: boolean | { maxPerSource: number; sourceField?: string };
  /** 排序方式：'retrieval' 保持原序，'score' 按分数降序，或传入自定义比较器 */
  orderBy?: "retrieval" | "score" | CandidateComparator;
  /** 是否输出调试信息（selectionTrace、droppedCandidates 等） */
  debug?: boolean;
  /** 自定义 promptContext 构建函数 */
  buildPromptContext?: (candidates: RetrievalCandidate[]) => string;
};

/**
 * 从 chunks 构造候选结果
 *
 * 尝试从 chunk.metadata.score 提取分数，否则默认为 0。
 */
function chunksToCandidates(chunks: Chunk[]): RetrievalCandidate[] {
  return chunks.map((chunk) => {
    const scoreFromMeta =
      typeof chunk.metadata?.score === "number" ? chunk.metadata.score : undefined;
    return {
      ...chunk,
      score: scoreFromMeta ?? 0,
    };
  });
}



/**
 * 默认检索后处理器
 *
 * 组合多种轻量策略件，提供可配置的检索后处理能力：
 * - 自定义谓词过滤
 * - 分数阈值过滤
 * - 近似去重
 * - 来源覆盖率限制
 * - 预算裁剪
 * - 上下文排序
 */
export class DefaultRetrievalPostprocessor implements RetrievalPostprocessor {
  constructor(private readonly options: DefaultPostprocessorOptions = {}) {}

  async postprocess(
    _query: Query,
    chunks: Chunk[],
    _context: RuntimeContext
  ): Promise<PostRetrievalResult> {
    let candidates = chunksToCandidates(chunks);
    const allDropped: DroppedCandidate[] = [];
    const allTrace: SelectionTraceItem[] = [];
    let appliedScoreThreshold: number | undefined;
    let appliedBudget = undefined;

    // 1. 自定义谓词过滤
    if (this.options.customPredicate) {
      const result = await applyCustomPredicate(
        candidates,
        this.options.customPredicate
      );
      candidates = result.kept;
      allDropped.push(...result.dropped);
      allTrace.push(...result.traceItems);
    }

    // 2. 分数阈值过滤
    if (this.options.scoreThreshold !== undefined) {
      const result = applyScoreThreshold(candidates, this.options.scoreThreshold);
      candidates = result.kept;
      allDropped.push(...result.dropped);
      allTrace.push(...result.traceItems);
      appliedScoreThreshold = this.options.scoreThreshold;
    }

    // 3. 近似去重
    if (this.options.nearDuplicate) {
      const ndOptions: NearDuplicateOptions | undefined =
        typeof this.options.nearDuplicate === "object"
          ? this.options.nearDuplicate
          : undefined;
      const result = applyNearDuplicateRemoval(candidates, ndOptions);
      candidates = result.kept;
      allDropped.push(...result.dropped);
      allTrace.push(...result.traceItems);
    }

    // 4. 来源覆盖率限制
    if (this.options.sourceCoverage) {
      const scOptions: SourceCoverageOptions =
        typeof this.options.sourceCoverage === "object"
          ? {
              maxPerSource: this.options.sourceCoverage.maxPerSource,
              sourceField: this.options.sourceCoverage.sourceField,
            }
          : { maxPerSource: 3 };
      const result = applySourceCoverage(candidates, scOptions);
      candidates = result.kept;
      allDropped.push(...result.dropped);
      allTrace.push(...result.traceItems);
    }

    // 5. 预算裁剪
    if (this.options.budget) {
      const result = applyBudgetTrim(candidates, this.options.budget);
      candidates = result.kept;
      allDropped.push(...result.dropped);
      allTrace.push(...result.traceItems);
      appliedBudget = result.appliedBudget;
    }

    // 6. 排序
    if (this.options.orderBy) {
      const comparator: CandidateComparator =
        this.options.orderBy === "score"
          ? scoreComparator
          : this.options.orderBy === "retrieval"
            ? () => 0
            : this.options.orderBy;
      const result = orderCandidates(candidates, comparator);
      candidates = result.ordered;
      allTrace.push(...result.traceItems);
    }

    // 构建 promptContext
    const buildContext =
      this.options.buildPromptContext ?? buildPromptContext;
    const promptContext = buildContext(candidates);

    // 组装结果
    const result: PostRetrievalResult = {
      chunks: candidates,
      promptContext,
      selectedCandidates: candidates,
    };

    if (this.options.debug) {
      result.droppedCandidates = allDropped;
      result.selectionTrace = allTrace;
      result.appliedScoreThreshold = appliedScoreThreshold;
      result.appliedBudget = appliedBudget;
      result.metadata = {
        strategy: "default",
        totalCandidates: chunks.length,
        selectedCount: candidates.length,
        droppedCount: allDropped.length,
        appliedScoreThreshold,
        appliedBudget,
      };
    } else {
      // debug=false 时仍提供基本统计，但省略完整 trace 和 dropped 详情
      result.metadata = {
        strategy: "default",
        totalCandidates: chunks.length,
        selectedCount: candidates.length,
        droppedCount: allDropped.length,
      };
    }

    return result;
  }
}
