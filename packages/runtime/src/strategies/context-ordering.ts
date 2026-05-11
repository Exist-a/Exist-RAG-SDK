import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";

/**
 * 候选结果比较器
 */
export type CandidateComparator = (
  a: RetrievalCandidate,
  b: RetrievalCandidate
) => number;

/**
 * 按分数降序排序的比较器
 */
export function scoreComparator(a: RetrievalCandidate, b: RetrievalCandidate): number {
  return b.score - a.score;
}

/**
 * 保持原始顺序的比较器（恒等排序）
 */
export function retrievalOrderComparator(): number {
  return 0;
}

/**
 * 上下文排序策略
 *
 * 对候选结果进行排序，并记录排序后的位置追踪。
 */
export function orderCandidates(
  candidates: RetrievalCandidate[],
  comparator?: CandidateComparator
): {
  ordered: RetrievalCandidate[];
  traceItems: SelectionTraceItem[];
} {
  const effectiveComparator = comparator ?? retrievalOrderComparator;
  const ordered = [...candidates].sort(effectiveComparator);
  const traceItems: SelectionTraceItem[] = [];

  ordered.forEach((candidate, index) => {
    traceItems.push({
      candidateId: candidate.id,
      action: "reordered",
      stage: "context-ordering",
      reason: `排序后位置: ${index + 1}`,
      orderIndex: index,
      score: candidate.score,
    });
  });

  return { ordered, traceItems };
}
