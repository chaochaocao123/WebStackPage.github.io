// 自动抓取行业资讯
// 数据源：amz123（跨境头条）、cifnews（雨果网）、mjzj（卖家之家）
// 用 RSS 抓取，每个源只取最近 20 条
// 用 URL 去重，已存在的不会更新（保留人工编辑）
// 最后更新：2026-06-11

import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

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

// 资讯源（RSS 优先，失败回退 HTML）
const FEEDS: Feed[] = [
  { source: 'amz123', url: 'https://www.amz123.com/feed' },
  { source: 'cifnews', url: 'https://www.cifnews.com/feed' },
  { source: 'mjzj', url: 'https://www.mjzj.com/feed' },
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

    const items: any[] = [];

    // 尝试找 RSS link
    const rssLink = $('link[type="application/rss+xml"]').attr('href');
    if (rssLink) {
      console.log(`  → 发现 RSS: ${rssLink}`);
      const feed = await parser.parseURL(rssLink);
      return feed.items;
    }

    return items;
  } catch (err: any) {
    console.error(`  HTML 抓取失败: ${err.message}`);
    return [];
  }
}

async function crawlFeed(feed: Feed) {
  let items: any[] = [];

  try {
    console.log(`📡 抓取 ${feed.source}: ${feed.url}`);
    const data = await parser.parseURL(feed.url);
    items = data.items;
  } catch (err: any) {
    console.warn(`  ⚠️ RSS 失败 (${err.message})，尝试 HTML 兜底`);
    items = await fetchHtmlItems(feed.source, feed.url);
  }

  if (items.length === 0) {
    console.log(`  ⏭️ ${feed.source} 0 条，跳过`);
    return { added: 0, skipped: 0 };
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
        select: { id: true, sourceType: true },
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
      const rawSummary = item.contentSnippet || item.contentSnippet || '';
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

  console.log(`  ✅ ${feed.source}: 新增 ${added}，已存在 ${skipped}`);
  return { added, skipped };
}

async function main() {
  console.log('🚀 开始抓取行业资讯...');
  const startTime = Date.now();

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const feed of FEEDS) {
    const { added, skipped } = await crawlFeed(feed);
    totalAdded += added;
    totalSkipped += skipped;
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

  console.log(`\n📊 总计：新增 ${totalAdded} 条，已存在 ${totalSkipped} 条`);
  console.log(`🗑️ 清理过期 ${deleteResult.count} 条`);
  console.log(`⏱️ 耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main()
  .catch(err => {
    console.error('❌ 抓取失败:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
