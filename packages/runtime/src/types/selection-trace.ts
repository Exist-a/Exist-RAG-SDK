import type { RetrievalCandidate } from "./retrieval-candidate.js";

/**
 * 候选结果在 post-retrieval 阶段经历的操作类型
 */
export type SelectionAction =
  | "kept"           // 保留
  | "dropped"        // 丢弃（通用原因）
  | "threshold"      // 因分数阈值被过滤
  | "trimmed"        // 因预算裁剪被移除
  | "reordered"      // 被重新排序
  | "duplicate"      // 近似重复被移除
  | "source-capped"  // 因来源覆盖率限制被移除
  | "predicate"      // 因自定义谓词被过滤
  ;

/**
 * 单个候选结果的操作追踪记录
 */
export type SelectionTraceItem = {
  /** 候选结果 ID */
  candidateId: string;
  /** 执行的操作 */
  action: SelectionAction;
  /** 操作发生的阶段或策略名 */
  stage: string;
  /** 操作原因描述 */
  reason: string;
  /** 相关分数（如原始分数、阈值等） */
  score?: number;
  /** 相关预算信息 */
  budgetInfo?: {
    limit: number;
    actual: number;
  };
  /** 排序后的位置（仅当 action 为 reordered 时有效） */
  orderIndex?: number;
};

/**
 * 实际生效的预算配置
 */
export type AppliedBudget = {
  /** 最大候选数量 */
  maxCandidates?: number;
  /** 最大 chunk 数量 */
  maxChunks?: number;
  /** 最大 prompt 字符数 */
  maxPromptChars?: number;
  /** 实际生效的字段 */
  appliedBy: "maxCandidates" | "maxChunks" | "maxPromptChars";
  /** 裁剪前数量 */
  beforeTrim: number;
  /** 裁剪后数量 */
  afterTrim: number;
};

/**
 * post-retrieval 阶段的调试信息汇总
 */
export type PostRetrievalDebug = {
  /** 检索返回的候选总数 */
  totalCandidates: number;
  /** 最终选中的候选数量 */
  selectedCount: number;
  /** 被丢弃的候选数量 */
  droppedCount: number;
  /** 是否应用了分数阈值 */
  appliedScoreThreshold?: number;
  /** 是否应用了预算裁剪 */
  appliedBudget?: AppliedBudget;
  /** 完整操作追踪（debug=false 时可能省略） */
  selectionTrace?: SelectionTraceItem[];
  /** 被丢弃的候选详情（debug=false 时可能省略） */
  droppedCandidates?: {
    candidateId: string;
    reason: string;
    stage: string;
  }[];
};
