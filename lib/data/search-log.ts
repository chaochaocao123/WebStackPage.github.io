import { prisma } from '@/lib/db';

const DEDUPE_WINDOW_MS = 5000; // 5 秒去重窗口

/**
 * 站内搜索日志记录（fire-and-forget）
 *
 * 设计要点：
 * - 5 秒去重：同一 keyword 5 秒内重搜只写 1 条（防刷新 + 防脚本连刷）
 * - 不记 sessionId：留 null（避免隐私争议；后续如要 UV/路径关联，再加 client-side cookie）
 * - 不记 IP：避免隐私争议
 * - 不阻塞 search 结果展示
 * - 失败只 console.error，不抛出（搜索是核心体验，监控是次要的）
 * - 静默过滤：keyword 长度 < 2 跳过（无意义搜索 / 误触 / 灌水）
 */
export async function logSearch(opts: {
  keyword: string;
  resultCount: number;
  tab?: string;
}) {
  const keyword = (opts.keyword || '').trim().slice(0, 100);
  if (keyword.length < 2) return;

  try {
    // 5 秒去重：同一 keyword 在 DEDUPE_WINDOW_MS 内已有记录则跳过
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const recent = await prisma.searchLog.findFirst({
      where: { keyword, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) return;

    await prisma.searchLog.create({
      data: {
        keyword,
        resultCount: opts.resultCount,
        tab: opts.tab || 'all',
        noResult: opts.resultCount === 0,
      },
    });
  } catch (err) {
    console.error('[search-log] write failed:', err);
  }
}

/**
 * 热门搜索关键词（最近 N 天）
 * 排除纯单字符 / 空结果（无结果词是另一个维度，单独看）
 */
export async function getTopKeywords(opts: {
  days?: number;
  limit?: number;
  excludeNoResult?: boolean;
} = {}) {
  const { days = 7, limit = 20, excludeNoResult = false } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000);

  // raw query: 按 keyword 聚合 + 排序
  const rows = await prisma.searchLog.groupBy({
    by: ['keyword'],
    where: {
      createdAt: { gte: since },
      ...(excludeNoResult ? { noResult: false } : {}),
    },
    _count: { keyword: true },
    orderBy: { _count: { keyword: 'desc' } },
    take: limit,
  });

  return rows.map((r) => ({
    keyword: r.keyword,
    count: r._count.keyword,
  }));
}

/**
 * 无结果搜索词（重点关注 — 用户搜不到东西 = SEO 漏点）
 */
export async function getNoResultKeywords(opts: { days?: number; limit?: number } = {}) {
  const { days = 7, limit = 30 } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000);

  const rows = await prisma.searchLog.groupBy({
    by: ['keyword'],
    where: {
      createdAt: { gte: since },
      noResult: true,
    },
    _count: { keyword: true },
    orderBy: { _count: { keyword: 'desc' } },
    take: limit,
  });

  return rows.map((r) => ({
    keyword: r.keyword,
    count: r._count.keyword,
  }));
}

/**
 * 最近搜索词
 */
export async function getRecentSearches(opts: { limit?: number } = {}) {
  const { limit = 50 } = opts;
  return prisma.searchLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      keyword: true,
      resultCount: true,
      tab: true,
      noResult: true,
      createdAt: true,
    },
  });
}

/**
 * 每日搜索量趋势（最近 N 天）
 */
export async function getDailyTrend(opts: { days?: number } = {}) {
  const { days = 14 } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000);

  // 用 raw SQL 做 date_trunc 聚合（Prisma groupBy 不支持 date 函数）
  const result = await prisma.$queryRaw<Array<{ day: Date; total: bigint; no_result: bigint }>>`
    SELECT
      DATE_TRUNC('day', "createdAt") as day,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE "noResult" = true) as no_result
    FROM "SearchLog"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;

  return result.map((r) => ({
    day: r.day,
    total: Number(r.total),
    noResult: Number(r.no_result),
  }));
}
