// 自动抓取优惠活动
// 策略：RSS 抓取优先 + 通用 HTML 兜底
// 数据源：amz123 优惠频道（尝试 RSS）
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

interface DealSource {
  source: string;
  rss?: string;
  html?: string;
  // HTML 兜底时取列表项的 CSS 选择器
  itemSelector?: string;
  titleSelector?: string;
  urlSelector?: string;
  descSelector?: string;
}

const SOURCES: DealSource[] = [
  {
    source: 'amz123',
    rss: 'https://www.amz123.com/feed',
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

      const summary = (item.contentSnippet || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      await prisma.deal.create({
        data: {
          title: item.title.trim().slice(0, 200),
          url: item.link,
          brand: 'amz123',
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

    // 兜底策略：抓页面所有链接，标题含"优惠/coupon"才保留
    let added = 0;
    const seen = new Set<string>();

    $('a').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      const text = $a.text().trim();
      if (!href || !text) return;
      if (!/优惠|coupon|折扣|折|code/i.test(text)) return;
      if (seen.has(href)) return;
      seen.add(href);
      if (added >= 10) return;

      // 异步添加（但我们这里不 await，收集成 promise 列表）
      // 简化：直接同步添加（crawler 是低频操作）
      prisma.deal
        .findFirst({ where: { url: href }, select: { id: true } })
        .then(existing => {
          if (existing) return;
          return prisma.deal.create({
            data: {
              title: text.slice(0, 200),
              url: href.startsWith('http') ? href : 'https://www.amz123.com' + href,
              brand: feed.source,
              description: '自动抓取，详见原文',
              discount: '详见原文',
              source: 'crawl',
            },
          });
        })
        .then(() => { added++; })
        .catch(() => { /* 忽略单条失败 */ });
    });

    // 等异步写完
    await new Promise(r => setTimeout(r, 1000));
    return added;
  } catch (err: any) {
    console.warn(`  ⚠️ HTML 抓取失败: ${err.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 开始抓取优惠活动...');
  const startTime = Date.now();

  let totalAdded = 0;
  for (const source of SOURCES) {
    console.log(`📡 ${source.source}...`);
    const fromRss = await crawlFromRss(source);
    if (fromRss > 0) {
      console.log(`  ✅ RSS 新增 ${fromRss}`);
      totalAdded += fromRss;
    } else {
      const fromHtml = await crawlFromHtml(source);
      console.log(`  ✅ HTML 新增 ${fromHtml}`);
      totalAdded += fromHtml;
    }
  }

  console.log(`\n📊 总计新增 ${totalAdded} 条优惠`);
  console.log(`⏱️ 耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main()
  .catch(err => {
    console.error('❌ 抓取失败:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
