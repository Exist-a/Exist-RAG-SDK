import type { RetrievalCandidate } from "./retrieval-candidate.js";

/**
 * 被丢弃的候选结果
 *
 * 记录被丢弃的候选及其丢弃原因，用于调试和可解释性。
 */
export type DroppedCandidate = {
  /** 被丢弃的候选 */
  candidate: RetrievalCandidate;
  /** 丢弃原因 */
  reason: string;
  /** 发生丢弃的阶段或策略名 */
  stage: string;
};
