// Vercel Cron: 抓取行业资讯
// 触发：每天北京时间 9:00 和 18:00（UTC 1:00 和 10:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求
// 数据源：wearesellers（跨境卖家社区问答）
// 用 RSS 抓取，每个源只取最近 20 条
// 用 URL 去重，已存在的不会更新（保留人工编辑）
// 2026-06-11: 替换 amz123/cifnews/mjzj（RSS 全部 404）→ wearesellers

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s 超时

const prisma = new PrismaClient();
const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)',
  },
});

interface Feed {
  source: string;
  url: string;
}

// 资讯源（wearesellers 跨境卖家社区，活跃 RSS）
const FEEDS: Feed[] = [
  { source: 'wearesellers', url: 'https://www.wearesellers.com/feed' },
];

// HTML 回退抓取（如果 RSS 失败）
async function fetchHtmlItems(source: string, url: string): Promise<any[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    // 尝试找 RSS link
    const rssLink = $('link[type="application/rss+xml"]').attr('href');
    if (rssLink) {
      const feed = await parser.parseURL(rssLink);
      return feed.items;
    }

    return [];
  } catch (err: any) {
    console.error(`  HTML 抓取失败: ${err.message}`);
    return [];
  }
}

async function crawlFeed(feed: Feed) {
  let items: any[] = [];

  try {
    const data = await parser.parseURL(feed.url);
    items = data.items;
  } catch (err: any) {
    items = await fetchHtmlItems(feed.source, feed.url);
  }

  if (items.length === 0) {
    return { added: 0, skipped: 0, source: feed.source, status: 'empty' };
  }

  let added = 0;
  let skipped = 0;

  // 只取最近 20 条
  for (const item of items.slice(0, 20)) {
    if (!item.link || !item.title) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.news.findUnique({
        where: { url: item.link },
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

      // 清理 HTML 摘要
      const rawSummary = item.contentSnippet || item.content || '';
      const cleanSummary = rawSummary
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300);

      await prisma.news.create({
        data: {
          title: item.title.trim().slice(0, 200),
          url: item.link,
          source: feed.source,
          sourceType: 'crawl',
          summary: cleanSummary || null,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          crawledAt: new Date(),
        },
      });
      added++;
    } catch (err: any) {
      console.error(`  跳过: ${item.link} (${err.message})`);
      skipped++;
    }
  }

  return { added, skipped, source: feed.source, status: 'ok' };
}

export async function GET(request: NextRequest) {
  // 验证 Vercel Cron 密钥
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: any[] = [];
  const errors: string[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const feed of FEEDS) {
    try {
      const r = await crawlFeed(feed);
      results.push(`${r.source}: +${r.added} / skip ${r.skipped} (${r.status})`);
      totalAdded += r.added;
      totalSkipped += r.skipped;
    } catch (err: any) {
      results.push(`${feed.source}: ERR ${err.message}`);
      errors.push(`${feed.source}: ${err.message}`);
    }
  }

  // 清理 30 天前的抓取资讯（保留手动发布的）
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
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// 也支持 POST（手动触发用）
export async function POST(request: NextRequest) {
  return GET(request);
}
