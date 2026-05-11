import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";

/**
 * 自定义候选谓词
 *
 * 允许应用开发者提供自定义判断逻辑来过滤候选结果。
 */
export type CandidatePredicate = (
  candidate: RetrievalCandidate
) => boolean | Promise<boolean>;

/**
 * 自定义谓词过滤策略
 *
 * 根据自定义谓词函数保留或丢弃候选结果。
 */
export async function applyCustomPredicate(
  candidates: RetrievalCandidate[],
  predicate: CandidatePredicate
): Promise<{
  kept: RetrievalCandidate[];
  dropped: DroppedCandidate[];
  traceItems: SelectionTraceItem[];
}> {
  const kept: RetrievalCandidate[] = [];
  const dropped: DroppedCandidate[] = [];
  const traceItems: SelectionTraceItem[] = [];

  for (const candidate of candidates) {
    const passed = await predicate(candidate);
    if (passed) {
      kept.push(candidate);
      traceItems.push({
        candidateId: candidate.id,
        action: "kept",
        stage: "custom-predicate",
        reason: "通过自定义谓词检查",
      });
    } else {
      dropped.push({
        candidate,
        reason: "未通过自定义谓词检查",
        stage: "custom-predicate",
      });
      traceItems.push({
        candidateId: candidate.id,
        action: "predicate",
        stage: "custom-predicate",
        reason: "未通过自定义谓词检查",
      });
    }
  }

  return { kept, dropped, traceItems };
}
