// 跨境工具说 - 资讯数据
// 自动从 mjzj、cifnews 抓取
// 也支持 admin 手动发布
// 最后更新：2026-06-12

import { prisma } from '@/lib/db';

export interface NewsItem {
  id: number;
  title: string;
  url: string;
  source: 'mjzj' | 'cifnews' | 'manual' | string;
  sourceLogo?: string | null;
  summary?: string | null;
  cover?: string | null;
  category?: string | null;
  content?: string | null;
  publishedAt: string;  // ISO 时间
  crawledAt: string;
  sourceType: 'crawl' | 'manual' | string;
  pinned: boolean;
}

/**
 * 从数据库读取资讯列表
 * - pinned 优先
 * - 按发布时间倒序
 * - 默认最多 60 条
 */
export async function getNewsFromDB(limit = 60): Promise<NewsItem[]> {
  const rows = await prisma.news.findMany({
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
  });
  return rows.map(r => ({
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
  }));
}

/**
 * 兼容旧代码：返回空数组（实际由 getNewsFromDB 提供数据）
 * @deprecated 请用 getNewsFromDB
 */
export const NEWS: NewsItem[] = [];
