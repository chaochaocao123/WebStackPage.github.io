// Vercel Cron: 抓取优惠活动
// 触发：每天北京时间 12:00（UTC 4:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求
// 数据源：wearesellers RSS（关键词过滤：优惠/折扣/code/coupon/折）
// URL 去重，已存在的不会更新
// 2026-06-11: amz123 RSS 失效 → wearesellers

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const prisma = new PrismaClient();
const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)',
  },
});

interface DealSource {
  source: string;
  rss?: string;
  html?: string;
}

const SOURCES: DealSource[] = [
  {
    source: 'wearesellers',
    rss: 'https://www.wearesellers.com/feed',
  },
];

async function crawlFromRss(feed: DealSource): Promise<number> {
  if (!feed.rss) return 0;
  try {
    const data = await parser.parseURL(feed.rss);
    let added = 0;

    for (const item of data.items.slice(0, 15)) {
      if (!item.link || !item.title) continue;

      const existing = await prisma.deal.findFirst({
        where: { url: item.link },
        select: { id: true },
      });
      if (existing) continue;

      // 过滤：只保留包含"优惠/折扣/code/coupon"关键词的资讯
      const text = ((item.title || '') + ' ' + (item.contentSnippet || '')).toLowerCase();
      if (!/优惠|折扣|code|coupon|discount|折|cndeals/.test(text)) {
        continue;
      }

      const summary = (item.contentSnippet || item.content || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      await prisma.deal.create({
        data: {
          title: item.title.trim().slice(0, 200),
          url: item.link,
          brand: feed.source,
          description: summary || '详见原文',
          discount: '详见原文',
          source: 'crawl',
        },
      });
      added++;
    }

    return added;
  } catch (err: any) {
    console.warn(`  ⚠️ RSS 失败: ${err.message}`);
    return 0;
  }
}

async function crawlFromHtml(feed: DealSource): Promise<number> {
  if (!feed.html) return 0;
  try {
    const res = await fetch(feed.html, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)' },
    });
    if (!res.ok) return 0;
    const html = await res.text();
    const $ = cheerio.load(html);

    let added = 0;
    const seen = new Set<string>();
    const writes: Promise<any>[] = [];

    $('a').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      const text = $a.text().trim();
      if (!href || !text) return;
      if (!/优惠|coupon|折扣|折|code/i.test(text)) return;
      if (seen.has(href)) return;
      seen.add(href);
      if (writes.length >= 10) return;

      const fullUrl = href.startsWith('http') ? href : 'https://www.amz123.com' + href;
      writes.push(
        prisma.deal
          .findFirst({ where: { url: fullUrl }, select: { id: true } })
          .then(existing => {
            if (existing) return null;
            return prisma.deal.create({
              data: {
                title: text.slice(0, 200),
                url: fullUrl,
                brand: feed.source,
                description: '自动抓取，详见原文',
                discount: '详见原文',
                source: 'crawl',
              },
            });
          })
          .then(result => {
            if (result) added++;
          })
          .catch(() => { /* 忽略单条失败 */ })
      );
    });

    await Promise.all(writes);
    return added;
  } catch (err: any) {
    console.warn(`  ⚠️ HTML 抓取失败: ${err.message}`);
    return 0;
  }
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

  for (const source of SOURCES) {
    try {
      const fromRss = await crawlFromRss(source);
      if (fromRss > 0) {
        results.push(`${source.source}: RSS +${fromRss}`);
        totalAdded += fromRss;
      } else {
        const fromHtml = await crawlFromHtml(source);
        results.push(`${source.source}: HTML +${fromHtml}`);
        totalAdded += fromHtml;
      }
    } catch (err: any) {
      results.push(`${source.source}: ERR ${err.message}`);
      errors.push(`${source.source}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    summary: `新增 ${totalAdded} 条优惠`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
