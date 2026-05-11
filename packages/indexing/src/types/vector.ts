/**
 * 向量类型
 */
export type Vector = {
  id: string;
  values: number[];
  metadata?: Record<string, string | number | boolean | null>;
};
