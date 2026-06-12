// 跨境工具说 - 文章数据
// DB（Article 模型）单一数据源，公开 /articles 列表和 /articles/[slug] 详情页都从这里取
// 最后更新：2026-06-12

import { prisma } from '@/lib/db';

export interface ArticleItem {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover?: string | null;
  category?: string | null;
  tags: string[];        // 解析自 JSON string
  source?: string | null;
  sourceType: 'manual' | 'crawl' | 'werss' | string;
  author: string;
  publishedAt: string;   // ISO
  viewCount: number;
}

/** 解析 Article.tags JSON string → string[]（DB 存的是 JSON 字符串） */
function parseTags(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** DB row → ArticleItem */
function toItem(row: any): ArticleItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    cover: row.cover,
    category: row.category,
    tags: parseTags(row.tags),
    source: row.source,
    sourceType: row.sourceType,
    author: row.author,
    publishedAt: new Date(row.publishedAt).toISOString(),
    viewCount: row.viewCount ?? 0,
  };
}

/** 公开列表：按发布时间倒序 */
export async function getArticlesFromDB(limit = 60): Promise<ArticleItem[]> {
  const rows = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
  return rows.map(toItem);
}

/** 公开详情：按 slug */
export async function getArticleBySlugFromDB(slug: string): Promise<ArticleItem | null> {
  const row = await prisma.article.findUnique({ where: { slug } });
  if (!row) return null;
  return toItem(row);
}
