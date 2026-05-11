/**
 * 运行时上下文
 *
 * 贯穿四阶段的可传递上下文对象
 */
export type RuntimeContext = {
  [key: string]: unknown;
};
