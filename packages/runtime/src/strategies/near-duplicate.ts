import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";
import { jaccardSimilarity } from "@rag-sdk/utils";

/**
 * 近似去重选项
 */
export type NearDuplicateOptions = {
  /** 相似度阈值，超过此值视为重复（默认 0.85） */
  similarityThreshold?: number;
  /** 自定义相似度函数，返回 0~1 */
  similarityFn?: (a: string, b: string) => number;
};



/**
 * 近似重复移除策略
 *
 * 检测并移除近似重复的候选结果，保留分数更高的候选。
 */
export function applyNearDuplicateRemoval(
  candidates: RetrievalCandidate[],
  options?: NearDuplicateOptions
): {
  kept: RetrievalCandidate[];
  dropped: DroppedCandidate[];
  traceItems: SelectionTraceItem[];
} {
  const threshold = options?.similarityThreshold ?? 0.85;
  const similarityFn = options?.similarityFn ?? ((a, b) => jaccardSimilarity(a, b, 2));

  const kept: RetrievalCandidate[] = [];
  const dropped: DroppedCandidate[] = [];
  const traceItems: SelectionTraceItem[] = [];

  for (const candidate of candidates) {
    let isDuplicate = false;
    let duplicateOf: RetrievalCandidate | undefined;

    for (const existing of kept) {
      const sim = similarityFn(candidate.content, existing.content);
      if (sim >= threshold) {
        isDuplicate = true;
        duplicateOf = existing;
        break;
      }
    }

    if (isDuplicate && duplicateOf) {
      // 比较分数，保留更高的
      if (candidate.score > duplicateOf.score) {
        // 替换：丢弃旧的，保留新的
        const index = kept.indexOf(duplicateOf);
        if (index !== -1) {
          kept[index] = candidate;
        }
        dropped.push({
          candidate: duplicateOf,
          reason: `被更高分数的近似重复候选替换 (score: ${duplicateOf.score} -> ${candidate.score})`,
          stage: "near-duplicate",
        });
        traceItems.push({
          candidateId: duplicateOf.id,
          action: "duplicate",
          stage: "near-duplicate",
          reason: `被更高分数的近似重复候选 ${candidate.id} 替换`,
          score: duplicateOf.score,
        });
        traceItems.push({
          candidateId: candidate.id,
          action: "kept",
          stage: "near-duplicate",
          reason: `替换近似重复候选 ${duplicateOf.id}（更高分数）`,
          score: candidate.score,
        });
      } else {
        // 丢弃当前候选
        dropped.push({
          candidate,
          reason: `近似重复于 ${duplicateOf.id}（分数更低或相等）`,
          stage: "near-duplicate",
        });
        traceItems.push({
          candidateId: candidate.id,
          action: "duplicate",
          stage: "near-duplicate",
          reason: `近似重复于 ${duplicateOf.id}（分数: ${candidate.score} <= ${duplicateOf.score}）`,
          score: candidate.score,
        });
      }
    } else {
      kept.push(candidate);
      traceItems.push({
        candidateId: candidate.id,
        action: "kept",
        stage: "near-duplicate",
        reason: "无近似重复",
      });
    }
  }

  return { kept, dropped, traceItems };
}
