// Vercel Cron: 抓取行业资讯
// 触发：每天北京时间 9:00 和 18:00（UTC 1:00 和 10:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求
// 数据源：卖家之家「跨境资讯通」authorId=312（mjzj.com 官方 AI Agent 公开 API，无需 token）
// 用 articlePcUrl 去重，已存在的不更新（保留人工编辑）
// 2026-06-12: 替换 wearesellers RSS（feed 已不更新）→ mjzj 官方 API（data.mjzj.com）

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s 超时

const prisma = new PrismaClient();

const MJZJ_API = 'https://data.mjzj.com/api/article/search';
const AUTHOR_ID = '312'; // 跨境资讯通
const PAGE_SIZE = 20;
const MAX_PAGES = 2; // 最多 2 页 = 40 条
const UA = 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)';

interface MjzjItem {
  id: string;
  articlePcUrl: string;
  title: string;
  summary?: string;
  aiSummary?: string;
  coverUrl?: string;
  publishTime: string;
  publishDateTime?: { value: number };
  author?: { name: string; avatarUrl: string };
  tags?: string[];
}

interface MjzjPage {
  list: MjzjItem[];
  nextPosition: string | null;
}

async function fetchPage(position: string): Promise<MjzjPage> {
  const url = `${MJZJ_API}?authorId=${encodeURIComponent(AUTHOR_ID)}&size=${PAGE_SIZE}${
    position ? `&position=${encodeURIComponent(position)}` : ''
  }`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`mjzj HTTP ${res.status}`);
  const json = (await res.json()) as { list?: MjzjItem[]; nextPosition?: string | null };
  return {
    list: Array.isArray(json.list) ? json.list : [],
    nextPosition: json.nextPosition ?? null,
  };
}

async function crawlMjzj() {
  let added = 0;
  let skipped = 0;
  let authorName = '';
  let authorLogo = '';
  let pageCount = 0;
  let position = '';
  let nextPosition: string | null = '';

  // 首次 position='', 之后用 nextPosition 翻页
  // nextPosition 为 null 表示最后一页
  while (nextPosition !== null && pageCount < MAX_PAGES) {
    const page = await fetchPage(position);
    pageCount++;
    nextPosition = page.nextPosition;

    for (const item of page.list) {
      if (!item.articlePcUrl || !item.title) {
        skipped++;
        continue;
      }

      // 记录作者信息（同一个 author 拉多页时值不变）
      if (item.author?.name) authorName = item.author.name;
      if (item.author?.avatarUrl) authorLogo = item.author.avatarUrl;

      try {
        const existing = await prisma.news.findUnique({
          where: { url: item.articlePcUrl },
          select: { id: true },
        });

        if (existing) {
          // 已存在：只更新 crawledAt，不动 title/summary（保留人工编辑）
          await prisma.news.update({
            where: { id: existing.id },
            data: { crawledAt: new Date() },
          });
          skipped++;
          continue;
        }

        const summary = (item.aiSummary || item.summary || '').trim().slice(0, 500) || null;
        const publishedAt = new Date(
          typeof item.publishDateTime?.value === 'number' ? item.publishDateTime.value : Date.now()
        );

        await prisma.news.create({
          data: {
            title: item.title.trim().slice(0, 200),
            url: item.articlePcUrl,
            source: 'mjzj',
            sourceLogo: authorLogo || null,
            summary,
            cover: item.coverUrl || null,
            publishedAt,
            crawledAt: new Date(),
            sourceType: 'crawl',
          },
        });
        added++;
      } catch (err: any) {
        console.error(`  跳过: ${item.articlePcUrl} (${err.message})`);
        skipped++;
      }
    }

    if (!nextPosition) break;
    position = nextPosition;
  }

  return { added, skipped, authorName, pages: pageCount };
}

export async function GET(request: NextRequest) {
  // 验证 Vercel Cron 密钥
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let lastSummary = '';

  try {
    const r = await crawlMjzj();
    totalAdded += r.added;
    totalSkipped += r.skipped;
    lastSummary = `mjzj[${r.authorName || '未知'}] +${r.added} / skip ${r.skipped} / pages ${r.pages}`;
    if (r.added === 0 && r.skipped === 0) {
      errors.push(`mjzj 抓取 0 条（pages=${r.pages}，可能 API 返回空）`);
    }
  } catch (err: any) {
    errors.push(`mjzj: ${err.message}`);
  }

  // 清理 30 天前的抓取资讯（保留手动发布的 + 置顶的）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deleteResult = await prisma.news.deleteMany({
    where: {
      sourceType: 'crawl',
      publishedAt: { lt: thirtyDaysAgo },
      pinned: false,
    },
  });

  return NextResponse.json({
    success: errors.length === 0,
    duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    summary: `新增 ${totalAdded}，已存在 ${totalSkipped}，清理过期 ${deleteResult.count}`,
    source: 'mjzj',
    details: lastSummary,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// 也支持 POST（手动触发用）
export async function POST(request: NextRequest) {
  return GET(request);
}
