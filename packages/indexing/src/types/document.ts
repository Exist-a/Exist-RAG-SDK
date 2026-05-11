/**
 * 文档类型
 */
export type Document = {
  id: string;
  content: string;
  metadata?: Record<string, string | number | boolean | null>;
};
