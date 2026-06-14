// 配合 scripts/wechat-export-tampermonkey.js 使用
// 把 blocks 数组转成 kjgjs 详情页能渲染的简化 HTML
// 用途：admin/articles/import-json Server Action 解析时调用

import { proxifyImgUrl } from './article-content-render';

const WECHAT_IMG_HOST_RE = /\bmmbiz\.qpic\.cn|mmbiz\.qlogo\.cn|wx\.qpic\.cn/i;

export type WechatBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; content: string }
  | { type: 'code'; content: string };

/** HTML 转义（防 XSS + 防止内容里的 < > 破坏结构） */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 单个 block 转 HTML 片段 */
function blockToHtml(block: WechatBlock): string {
  switch (block.type) {
    case 'text':
      // 空文本段落：包成空 <p>（保持节奏）
      if (!block.content) return '<p></p>';
      return `<p>${esc(block.content)}</p>`;
    case 'image': {
      const url = block.url || '';
      if (!url) return '';
      // mmbiz 图床 → 走代理；其他 URL 保持原样
      const src = WECHAT_IMG_HOST_RE.test(url) ? proxifyImgUrl(url) || url : url;
      return `<img src="${esc(src)}" alt="${esc(block.alt || '')}" class="wechat-img max-w-full h-auto my-3 rounded-lg" loading="lazy" />`;
    }
    case 'heading': {
      const level = Math.min(Math.max(block.level, 1), 6);
      return `<h${level}>${esc(block.content)}</h${level}>`;
    }
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      const items = (block.items || [])
        .map((it) => `<li>${esc(it)}</li>`)
        .join('');
      return `<${tag}>${items}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${esc(block.content)}</blockquote>`;
    case 'code':
      return `<pre><code>${esc(block.content)}</code></pre>`;
    default:
      return '';
  }
}

/** blocks 数组 → 简化 HTML（用于 Article.content 字段） */
export function blocksToHtml(blocks: unknown): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map((b) => {
      if (!b || typeof b !== 'object') return '';
      return blockToHtml(b as WechatBlock);
    })
    .filter(Boolean)
    .join('\n');
}
