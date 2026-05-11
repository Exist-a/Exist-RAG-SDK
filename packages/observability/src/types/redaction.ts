/**
 * 脱敏配置选项
 */
export type RedactionOptions = {
  /** 需要脱敏的字段路径列表（支持点路径，如 "user.email"） */
  fields?: string[];
  /** 是否对 content / prompt / answer 类字段进行 masking */
  maskContent?: boolean;
  /** content preview 长度（默认 200） */
  contentPreviewLength?: number;
  /** 脱敏替换字符串（默认 "[REDACTED]"） */
  replacement?: string;
};
