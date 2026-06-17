// Vercel Cron: 抓取优惠活动
// 触发：每天北京时间 12:00（UTC 4:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求
// 数据源：Tool 表全 70 个工具官网首页（HTML 抓取 + 优惠关键词过滤）
// URL 去重，已存在的不会更新
// 2026-06-11: amz123 RSS 失效 → wearesellers
// 2026-06-17 v1: wearesellers 不在 Tool 表（违反"只从工具列表里的网站抓"硬规）
//            → 改造为遍历 Tool 表，HTML 抓取官网首页 + 关键词过滤
//            → brand 字段直接 = Tool.name（保证 /deals 页面能匹配 logo）
// 2026-06-17 v2（决策 214 曹总修正）：不再过滤 discount 字段，全 70 工具都抓
//            → 70 工具全量 dry test 49s 接近 50s 上限，PER_TOOL_DELAY_MS 300ms → 200ms
//            → 命中率会下降（5/28 → 预计 5-10/70），后续按入库情况加折扣白名单

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const prisma = new PrismaClient();

interface DealSource {
  source: string;       // 来源标识：'tool_<toolId>'
  brand: string;        // Tool.name（写入 Deal.brand）
  html: string;         // 抓取 URL（Tool.url 字段）
  category: string;     // Tool.categoryKey（写入 Deal.category）
}

const KEYWORD_RE = /优惠|折扣|code|coupon|discount|折|限时|活动|立减|新人|专享|领券|补贴/i;
const PER_TOOL_LIMIT = 5;     // 每个工具最多加 5 条
const PER_TOOL_DELAY_MS = 300; // 每个工具抓完后 sleep 300ms
const TOTAL_LIMIT = 50;       // 整轮最多加 50 条
const TIMEOUT_MS = 8000;      // 单个工具抓取超时
const MAX_TOOLS = 70;         // 最多跑 70 个工具

const UA = 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)';

async function loadToolSources(): Promise<DealSource[]> {
  // 抓 Tool 表全 70 个工具（v2 决策 214：不再过滤 discount 字段）
  // 2026-06-17 v1 原本只抓 25-28 个有 discount 字段的工具（命中率 30-50%）
  // 2026-06-17 v2 曹总修正：所有工具都跑一遍，命中率可能下降但覆盖面广
  //       后续按入库情况加折扣白名单（黑名单词/工具方对接等）
  const tools = await prisma.tool.findMany({
    where: {
      url: { not: '' },
    },
    select: { id: true, name: true, url: true, categoryKey: true },
    orderBy: { id: 'asc' },
    take: MAX_TOOLS,
  });
  return tools
    .filter((t) => t.url && t.url.startsWith('http'))
    .map((t) => ({
      source: `tool_${t.id}`,
      brand: t.name,
      html: t.url,
      category: t.categoryKey,
    }));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function crawlFromHtml(feed: DealSource): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(feed.html, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      console.warn(`  ⚠️ ${feed.brand} HTTP ${res.status}`);
      return 0;
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    let added = 0;
    const seen = new Set<string>();
    const writes: Promise<any>[] = [];

    // 1) 抓 <a> 链接（正文/导航/页脚的优惠关键词）
    $('a').each((_, el) => {
      if (added >= PER_TOOL_LIMIT) return;
      const $a = $(el);
      const href = $a.attr('href');
      const text = $a.text().trim();
      if (!href || !text || text.length > 200) return;
      if (!KEYWORD_RE.test(text)) return;
      // 拼绝对 URL
      let fullUrl = href;
      if (href.startsWith('/')) {
        try {
          fullUrl = new URL(href, feed.html).toString();
        } catch {
          return;
        }
      } else if (!href.startsWith('http')) {
        return;
      }
      // 过滤：同一站内的优惠页才保留（避免抓到外站不相关链接）
      try {
        const u = new URL(fullUrl);
        const base = new URL(feed.html);
        if (u.hostname !== base.hostname && !u.hostname.endsWith(`.${base.hostname}`)) {
          return;
        }
      } catch {
        return;
      }
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);

      writes.push(
        prisma.deal
          .findFirst({ where: { url: fullUrl }, select: { id: true } })
          .then((existing) => {
            if (existing) return null;
            return prisma.deal.create({
              data: {
                title: text.slice(0, 200),
                url: fullUrl,
                brand: feed.brand,
                category: feed.category,
                description: `自动抓取自 ${feed.brand} 官网`,
                discount: '详见原文',
                source: 'crawl',
              },
            });
          })
          .then((result) => {
            if (result) added++;
          })
          .catch(() => { /* 忽略单条失败 */ })
      );
    });

    // 2) 抓 <button>/<span>/<div> 含优惠关键词的纯文字（常见于 banner 活动）
    $('button, span, div, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
      if (added >= PER_TOOL_LIMIT) return;
      const $el = $(el);
      // 只看直接文本（不递归子元素）
      const direct = ($el.contents().filter(function () {
        return this.type === 'text';
      }).text() || '').trim();
      if (!direct || direct.length > 100) return;
      if (!KEYWORD_RE.test(direct)) return;
      // 跳过含 <a> 的（避免重复抓）
      if ($el.find('a').length > 0) return;

      // 拼一个站内锚链接到 brand 主页（占位 URL，去重时不会和别的工具撞）
      const anchorUrl = `${feed.html.split('?')[0]}#deal-${encodeURIComponent(direct).slice(0, 30)}`;
      if (seen.has(anchorUrl)) return;
      seen.add(anchorUrl);

      writes.push(
        prisma.deal
          .findFirst({ where: { url: anchorUrl }, select: { id: true } })
          .then((existing) => {
            if (existing) return null;
            return prisma.deal.create({
              data: {
                title: `${feed.brand} - ${direct}`.slice(0, 200),
                url: anchorUrl,
                brand: feed.brand,
                category: feed.category,
                description: `自动抓取自 ${feed.brand} 官网 Banner`,
                discount: direct,
                source: 'crawl',
              },
            });
          })
          .then((result) => {
            if (result) added++;
          })
          .catch(() => { /* 忽略单条失败 */ })
      );
    });

    await Promise.all(writes);
    return added;
  } catch (err: any) {
    const msg = err.name === 'AbortError' ? 'timeout' : err.message;
    console.warn(`  ⚠️ ${feed.brand} 失败: ${msg}`);
    return 0;
  } finally {
    clearTimeout(timer);
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

  // 动态加载 Tool 表的 70 个工具
  let sources: DealSource[] = [];
  try {
    sources = await loadToolSources();
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `加载 Tool 表失败: ${err.message}` },
      { status: 500 }
    );
  }
  results.push(`加载数据源: ${sources.length} 个工具`);

  for (const source of sources) {
    if (totalAdded >= TOTAL_LIMIT) {
      results.push(`已满 ${TOTAL_LIMIT} 条，提前结束`);
      break;
    }
    // 剩余时间检查（< 3s 停止）
    const elapsed = Date.now() - startTime;
    if (elapsed > 50000) {
      results.push(`已跑 50s，提前结束（还剩 ${sources.length - results.length} 个工具未跑）`);
      break;
    }

    try {
      const added = await crawlFromHtml(source);
      results.push(`${source.brand} (${source.category}): +${added}`);
      totalAdded += added;
    } catch (err: any) {
      results.push(`${source.brand}: ERR ${err.message}`);
      errors.push(`${source.brand}: ${err.message}`);
    }
    // 限速
    await sleep(PER_TOOL_DELAY_MS);
  }

  return NextResponse.json({
    success: errors.length === 0,
    duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
    summary: `新增 ${totalAdded} 条优惠（数据源：${sources.length} 个 Tool 表工具）`,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
