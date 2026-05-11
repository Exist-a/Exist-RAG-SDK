import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";

/**
 * 分数阈值过滤策略
 *
 * 移除分数低于阈值的候选结果。
 */
export function applyScoreThreshold(
  candidates: RetrievalCandidate[],
  threshold: number
): {
  kept: RetrievalCandidate[];
  dropped: DroppedCandidate[];
  traceItems: SelectionTraceItem[];
} {
  const kept: RetrievalCandidate[] = [];
  const dropped: DroppedCandidate[] = [];
  const traceItems: SelectionTraceItem[] = [];

  for (const candidate of candidates) {
    if (candidate.score >= threshold) {
      kept.push(candidate);
      traceItems.push({
        candidateId: candidate.id,
        action: "kept",
        stage: "score-threshold",
        reason: `分数 ${candidate.score.toFixed(4)} >= 阈值 ${threshold}`,
        score: candidate.score,
      });
    } else {
      dropped.push({
        candidate,
        reason: `分数 ${candidate.score.toFixed(4)} 低于阈值 ${threshold}`,
        stage: "score-threshold",
      });
      traceItems.push({
        candidateId: candidate.id,
        action: "threshold",
        stage: "score-threshold",
        reason: `分数 ${candidate.score.toFixed(4)} 低于阈值 ${threshold}`,
        score: candidate.score,
      });
    }
  }

  return { kept, dropped, traceItems };
}
