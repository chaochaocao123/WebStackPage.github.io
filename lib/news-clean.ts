// 清洗 News 标题中的"卖家之家"字眼前缀
// 2026-06-15 创建：从 scripts/news-clean-warejia.ts 抽取出来
//                给 crawl-news/route.ts 和 manual-crawl-news.ts 共用
// 背景：v11.8 清理了 UI 层的"卖家之家"来源标签，但漏掉了 mjzj 抓取的原始 title 前缀
//       route.ts 的 v4 注释承诺加清洗但代码没实现，这次补上
// 教训（决策 158）：简化抓取脚本时必须保留 v4+ 改造的清洗逻辑
// MEMORY 硬规：kjgjs 全站禁止"卖家之家"字眼

const TITLE_PREFIX_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: '早讯', pattern: /^卖家之家早讯\s*[|｜]\s*/ },
  { name: '晚讯', pattern: /^卖家之家晚讯\s*[|｜]\s*/ },
  { name: '午讯', pattern: /^卖家之家午讯\s*[|｜]\s*/ },
  { name: '通用 | ', pattern: /^卖家之家\s*[|｜]\s*/ },
  { name: '[卖家之家]', pattern: /^\[\s*卖家之家\s*\][\s:：]*/ },
  { name: '（卖家之家）', pattern: /^[（(]\s*卖家之家\s*[)）][\s:：]*/ },
];

/**
 * 清洗 News 标题前缀
 * @returns 有清洗 → { cleaned, matchedName }；无清洗 → null
 */
export function cleanNewsTitle(original: string): { cleaned: string; matchedName: string } | null {
  if (!original) return null;
  for (const { name, pattern } of TITLE_PREFIX_PATTERNS) {
    if (pattern.test(original)) {
      const cleaned = original.replace(pattern, '').trim();
      if (cleaned && cleaned !== original) {
        return { cleaned, matchedName: name };
      }
    }
  }
  return null;
}
