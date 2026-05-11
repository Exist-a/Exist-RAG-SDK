import type { Chunk } from "@rag-sdk/core";
import type { RetrievalCandidate } from "./retrieval-candidate.js";
import type { DroppedCandidate } from "./dropped-candidate.js";
import type { SelectionTraceItem, AppliedBudget } from "./selection-trace.js";

/**
 * 检索后处理结果
 */
export type PostRetrievalResult = {
  chunks: Chunk[];
  promptContext?: string;
  metadata?: Record<string, unknown>;
  /** 最终选中的候选结果（含分数和元数据） */
  selectedCandidates?: RetrievalCandidate[];
  /** 被丢弃的候选结果及其原因 */
  droppedCandidates?: DroppedCandidate[];
  /** 候选选择和过滤的完整操作追踪 */
  selectionTrace?: SelectionTraceItem[];
  /** 实际生效的预算配置 */
  appliedBudget?: AppliedBudget;
  /** 实际生效的分数阈值 */
  appliedScoreThreshold?: number;
};
