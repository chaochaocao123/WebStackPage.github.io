/**
 * Article 相关工具函数
 */

/** 从标题生成 URL slug（保留 ASCII + 数字，空格转 -） */
export function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]+/g, '')   // 去非 ASCII 字母数字
    .replace(/\s+/g, '-')              // 空格转 -
    .replace(/-+/g, '-')               // 合并连续 -
    .replace(/^-+|-+$/g, '')           // 去首尾 -
    .slice(0, 60);
}

/** 从 HTML content 抽取纯文本前 N 字（用于自动 excerpt） */
export function autoExcerpt(html: string, maxLen = 160): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .replace(/[，。！？、：；]?\s*$/, '') + (html.length > maxLen ? '…' : '');
}
