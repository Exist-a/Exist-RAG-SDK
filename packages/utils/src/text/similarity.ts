/**
 * 生成字符串的 n-gram 集合
 */
export function ngramSet(s: string, n: number): Set<string> {
  const set = new Set<string>();
  if (s.length < n) return set;
  for (let i = 0; i <= s.length - n; i++) {
    set.add(s.slice(i, i + n));
  }
  return set;
}

/**
 * 计算两个字符串的 Jaccard 相似度
 *
 * 基于字符 n-gram 的 Jaccard 系数，返回 0~1。
 *
 * @param a 第一个字符串
 * @param b 第二个字符串
 * @param n n-gram 大小（默认 2）
 * @returns 相似度，0 表示完全不同，1 表示完全相同
 */
export function jaccardSimilarity(a: string, b: string, n: number = 2): number {
  if (a === b) return 1;
  if (a.length < n || b.length < n) return 0;

  const setA = ngramSet(a, n);
  const setB = ngramSet(b, n);

  if (setA.size === 0 && setB.size === 0) return 0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}
