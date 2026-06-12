// 跨境工具说 - 全站搜索
// 同时搜 News / Tool / Article / Deal 4 张表，PG 大小写不敏感
// 最后更新：2026-06-12

import { Fragment, type ReactNode } from 'react';
import { prisma } from '@/lib/db';
import type { NewsItem } from './news';
import type { ArticleItem } from './articles';
import type { DealItem } from './deals';
import type { Tool } from './tools-db';

export type SearchTab = 'all' | 'news' | 'tools' | 'articles' | 'deals';

export interface SearchResults {
  q: string;
  total: number;
  news: NewsItem[];
  tools: Tool[];
  articles: ArticleItem[];
  deals: DealItem[];
  counts: {
    all: number;
    news: number;
    tools: number;
    articles: number;
    deals: number;
  };
}

const PER_TAB = 12;

/** 去掉首尾空白 + 截断超长 query（防恶意超长 URL 拖死 DB） */
function normalizeQuery(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.trim().slice(0, 100);
}

/** DB row → NewsItem（与 lib/data/news.ts 保持一致） */
function newsRowToItem(r: any): NewsItem {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    source: r.source,
    sourceLogo: r.sourceLogo,
    summary: r.summary,
    cover: r.cover,
    category: r.category,
    publishedAt: r.publishedAt.toISOString(),
    crawledAt: r.crawledAt.toISOString(),
    sourceType: r.sourceType,
    pinned: r.pinned,
  };
}

/** DB row → ArticleItem */
function articleRowToItem(r: any): ArticleItem {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(r.tags || '[]');
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    /* ignore */
  }
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    content: r.content,
    excerpt: r.excerpt,
    cover: r.cover,
    category: r.category,
    tags,
    source: r.source,
    sourceType: r.sourceType,
    author: r.author,
    publishedAt: new Date(r.publishedAt).toISOString(),
    viewCount: r.viewCount ?? 0,
  };
}

/** DB row → Tool */
function toolRowToItem(r: any): Tool {
  return {
    name: r.name,
    url: r.url,
    business: r.business,
    category: r.categoryKey,
    affiliateUrl: r.affiliateUrl,
    discount: r.discount,
    logo: r.logo,
    featured: r.featured,
  };
}

/** DB row → DealItem */
function dealRowToItem(r: any): DealItem {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    brand: r.brand,
    brandLogo: r.brandLogo,
    category: r.category,
    discount: r.discount,
    description: r.description,
    startDate: r.startDate ? r.startDate.toISOString() : null,
    endDate: r.endDate ? r.endDate.toISOString() : null,
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/**
 * 全站搜索
 * - q 为空：返回全 0 结果（页面用空状态引导）
 * - 4 张表并行查，每表 limit=PER_TAB
 * - 用 mode: 'insensitive' 大小写不敏感（Neon PG 原生支持）
 */
export async function searchAll(rawQ: string | undefined | null): Promise<SearchResults> {
  const q = normalizeQuery(rawQ);

  if (!q) {
    return {
      q: '',
      total: 0,
      news: [],
      tools: [],
      articles: [],
      deals: [],
      counts: { all: 0, news: 0, tools: 0, articles: 0, deals: 0 },
    };
  }

  const [newsRows, toolRows, articleRows, dealRows, newsCount, toolCount, articleCount, dealCount] =
    await Promise.all([
      prisma.news.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        take: PER_TAB,
      }),
      prisma.tool.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { business: { contains: q, mode: 'insensitive' } },
            { categoryKey: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ featured: 'desc' }, { sort: 'asc' }],
        take: PER_TAB,
      }),
      prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        take: PER_TAB,
      }),
      prisma.deal.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: PER_TAB,
      }),
      prisma.news.count({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.tool.count({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { business: { contains: q, mode: 'insensitive' } },
            { categoryKey: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.article.count({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { excerpt: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
      prisma.deal.count({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

  const counts = {
    news: newsCount,
    tools: toolCount,
    articles: articleCount,
    deals: dealCount,
  };

  return {
    q,
    total: counts.news + counts.tools + counts.articles + counts.deals,
    news: newsRows.map(newsRowToItem),
    tools: toolRows.map(toolRowToItem),
    articles: articleRows.map(articleRowToItem),
    deals: dealRows.map(dealRowToItem),
    counts: {
      ...counts,
      all: counts.news + counts.tools + counts.articles + counts.deals,
    },
  };
}

/**
 * 在文本中找到 q 出现的位置，截取前后 80 字符上下文
 * 不做高亮 — 由调用方用 React 节点做高亮（避免 XSS）
 */
export function findSnippet(text: string, q: string, ctxBefore = 60, ctxAfter = 100): string {
  if (!text || !q) return text?.slice(0, ctxBefore + ctxAfter) || '';
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) {
    return text.slice(0, ctxBefore + ctxAfter);
  }
  const start = Math.max(0, idx - ctxBefore);
  const end = Math.min(text.length, idx + q.length + ctxAfter);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

/**
 * 把含 q 的字符串拆成 React fragment 数组（用于服务端组件高亮）
 *  - q 大小写不敏感匹配
 *  - 保留原文大小写
 *  - 不 escape HTML（因为 React 节点天然防 XSS）
 */
export function highlightParts(text: string, q: string): ReactNode {
  if (!text || !q) return text;
  // 转义正则元字符
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(re);
  const qLower = q.toLowerCase();
  return parts.map((p, i) =>
    p.toLowerCase() === qLower ? (
      <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
        {p}
      </mark>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    )
  );
}
