import type { RetrievalCandidate } from "../types/retrieval-candidate.js";
import type { DroppedCandidate } from "../types/dropped-candidate.js";
import type { SelectionTraceItem } from "../types/selection-trace.js";

/**
 * 来源覆盖率选项
 */
export type SourceCoverageOptions = {
  /** 每个来源最多保留的候选数量（默认 3） */
  maxPerSource: number;
  /** 提取 source 的字段名（默认 "source"） */
  sourceField?: string;
};

/**
 * 从候选的 metadata 中提取 source 标识
 */
function getSource(
  candidate: RetrievalCandidate,
  sourceField: string
): string {
  const source = candidate.metadata?.[sourceField];
  return typeof source === "string" ? source : "__unknown__";
}

/**
 * 来源覆盖率限制策略
 *
 * 限制单一来源的候选结果数量，避免单一来源独占结果集。
 */
export function applySourceCoverage(
  candidates: RetrievalCandidate[],
  options?: SourceCoverageOptions
): {
  kept: RetrievalCandidate[];
  dropped: DroppedCandidate[];
  traceItems: SelectionTraceItem[];
} {
  const maxPerSource = options?.maxPerSource ?? 3;
  const sourceField = options?.sourceField ?? "source";

  const kept: RetrievalCandidate[] = [];
  const dropped: DroppedCandidate[] = [];
  const traceItems: SelectionTraceItem[] = [];
  const sourceCount = new Map<string, number>();

  for (const candidate of candidates) {
    const source = getSource(candidate, sourceField);
    const current = sourceCount.get(source) ?? 0;

    if (current < maxPerSource) {
      kept.push(candidate);
      sourceCount.set(source, current + 1);
      traceItems.push({
        candidateId: candidate.id,
        action: "kept",
        stage: "source-coverage",
        reason: `来源 "${source}" 在限制范围内 (${current + 1}/${maxPerSource})`,
      });
    } else {
      dropped.push({
        candidate,
        reason: `来源 "${source}" 超出数量限制 (${maxPerSource})`,
        stage: "source-coverage",
      });
      traceItems.push({
        candidateId: candidate.id,
        action: "source-capped",
        stage: "source-coverage",
        reason: `来源 "${source}" 超出数量限制 (${maxPerSource})`,
      });
    }
  }

  return { kept, dropped, traceItems };
}
