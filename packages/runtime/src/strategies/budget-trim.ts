import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem, AppliedBudget } from "../types/selection-trace.js";

/**
 * 预算配置
 */
export type BudgetConfig = {
  /** 最大候选数量 */
  maxCandidates?: number;
  /** 最大 chunk 数量（与 maxCandidates 语义相同，提供别名） */
  maxChunks?: number;
  /** 最大 prompt 上下文字符数 */
  maxPromptChars?: number;
};

/**
 * 预算裁剪策略
 *
 * 根据预算限制裁剪候选结果数量。
 * 优先按 maxCandidates / maxChunks 控制数量，若配置了 maxPromptChars 则进一步按字符数裁剪。
 */
export function applyBudgetTrim(
  candidates: RetrievalCandidate[],
  budget: BudgetConfig
): {
  kept: RetrievalCandidate[];
  dropped: DroppedCandidate[];
  traceItems: SelectionTraceItem[];
  appliedBudget: AppliedBudget;
} {
  const limit = budget.maxCandidates ?? budget.maxChunks;
  const maxPromptChars = budget.maxPromptChars;

  let kept = [...candidates];
  const dropped: DroppedCandidate[] = [];
  const traceItems: SelectionTraceItem[] = [];

  // 1. 按数量裁剪
  if (limit !== undefined && limit >= 0 && candidates.length > limit) {
    const trimmed = kept.slice(limit);
    kept = kept.slice(0, limit);

    for (const candidate of trimmed) {
      dropped.push({
        candidate,
        reason: `超出数量限制 (limit=${limit})`,
        stage: "budget-trim",
      });
      traceItems.push({
        candidateId: candidate.id,
        action: "trimmed",
        stage: "budget-trim",
        reason: `超出数量限制 (limit=${limit})`,
        budgetInfo: { limit, actual: candidates.length },
      });
    }
  }

  // 2. 按字符数裁剪
  if (maxPromptChars !== undefined && maxPromptChars >= 0) {
    let charCount = 0;
    const charKept: RetrievalCandidate[] = [];
    for (const candidate of kept) {
      const nextCount = charCount + candidate.content.length;
      if (nextCount <= maxPromptChars) {
        charCount = nextCount;
        charKept.push(candidate);
      } else {
        dropped.push({
          candidate,
          reason: `超出字符预算 (maxPromptChars=${maxPromptChars})`,
          stage: "budget-trim",
        });
        traceItems.push({
          candidateId: candidate.id,
          action: "trimmed",
          stage: "budget-trim",
          reason: `超出字符预算 (maxPromptChars=${maxPromptChars})`,
          budgetInfo: { limit: maxPromptChars, actual: charCount + candidate.content.length },
        });
      }
    }
    kept = charKept;
  }

  // 记录保留的候选
  for (const candidate of kept) {
    traceItems.push({
      candidateId: candidate.id,
      action: "kept",
      stage: "budget-trim",
      reason: "在预算范围内",
    });
  }

  const appliedBy: AppliedBudget["appliedBy"] =
    limit !== undefined ? (budget.maxCandidates !== undefined ? "maxCandidates" : "maxChunks") : "maxPromptChars";

  const appliedBudget: AppliedBudget = {
    maxCandidates: budget.maxCandidates,
    maxChunks: budget.maxChunks,
    maxPromptChars: budget.maxPromptChars,
    appliedBy,
    beforeTrim: candidates.length,
    afterTrim: kept.length,
  };

  return { kept, dropped, traceItems, appliedBudget };
}
