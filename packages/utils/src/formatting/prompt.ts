/**
 * 将内容列表拼接为 prompt 上下文字符串
 *
 * @param items 内容项列表（每个项至少包含 `content` 字段）
 * @param separator 分隔符（默认 `"\n\n"`）
 * @returns 拼接后的上下文字符串
 */
export function buildPromptContext<T extends { content: string }>(
  items: T[],
  separator: string = "\n\n"
): string {
  return items.map((item) => item.content).join(separator);
}
