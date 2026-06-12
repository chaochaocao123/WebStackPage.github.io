// Vercel Cron: 抓取行业资讯
// 触发：每天北京时间 9:00 和 18:00（UTC 1:00 和 10:00）
// 安全：用 Vercel 的 CRON_SECRET 验证请求
// 数据源：卖家之家「跨境资讯通」authorId=312（mjzj.com 官方 AI Agent 公开 API，无需 token）
// 2026-06-12 v2: 改抓 mjzj 官方 API 替换 wearesellers RSS（feed 已不更新）
// 2026-06-12 v3: 抓正文内嵌渲染（不外跳）— 抓 mjzj 文章页 HTML 解析 article-content
//   - 不引入 cheerio，用轻量正则清理
//   - 写入 News.content 字段
//   - 已有 url 但没 content 的也会回填
//   - 用 articlePcUrl 去重，已存在的不更新（保留人工编辑）
//   注：cheerio 仍保留在 deps 中（crawl-deals 在用）

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
const ARTICLE_FETCH_TIMEOUT_MS = 5000; // 单篇 HTML 抓取超时

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

/**
 * 抓 mjzj 文章页 HTML，解析 article-content 块，清理样式
 * 不引入 cheerio，用轻量正则（mjzj 是微信编辑器风格的 HTML，结构稳定）
 * 返回清理后的 HTML 字符串；失败返回 ''
 */
async function fetchArticleContent(articlePcUrl: string): Promise<string> {
  if (!articlePcUrl.includes('mjzj.com/article/')) return '';
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);
    const res = await fetch(articlePcUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!res.ok) return '';
    const html = await res.text();

    // 1. 提取 article-content 块（到 article-tags 之前）
    const match = html.match(/<div[^>]*class="article-content"[^>]*>([\s\S]*?)<div[^>]*class="article-tags/i);
    if (!match) return '';
    let body = match[1];

    // 2. 移除 style / class 属性
    body = body.replace(/\s+style="[^"]*"/gi, '');
    body = body.replace(/\s+class="[^"]*"/gi, '');

    // 3. 循环解包嵌套的 <section> 和 <span>（保留 innerHTML）
    let prev = '';
    let loop = 0;
    while (prev !== body && loop < 10) {
      prev = body;
      body = body.replace(/<section[^>]*>([\s\S]*?)<\/section>/gi, '$1');
      body = body.replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, '$1');
      loop++;
    }

    // 4. <a> 加 target="_blank" rel="noopener noreferrer"
    body = body.replace(/<a\s+([^>]*?)>/gi, (m, attrs) => {
      if (/target\s*=/i.test(attrs)) return m;
      return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
    });

    // 5. <img> 加 loading="lazy"
    body = body.replace(/<img\s+([^>]*?)>/gi, (m, attrs) => {
      if (/loading\s*=/i.test(attrs)) return m;
      return `<img ${attrs} loading="lazy">`;
    });

    // 6. 移除注释 + 空段落 + 尾部残留
    body = body.replace(/<!--[\s\S]*?-->/g, '');
    body = body.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, '');
    body = body.replace(/(\s*<\/div>\s*)+$/i, '').trim();

    return body;
  } catch (err) {
    console.warn(`  [article fetch fail] ${articlePcUrl}: ${(err as Error).message}`);
    return '';
  }
}

async function crawlMjzj() {
  let added = 0;
  let skipped = 0;
  let contentFilled = 0;
  let authorName = '';
  let authorLogo = '';
  let pageCount = 0;
  let position = '';
  let nextPosition: string | null = '';

  // 收集本页所有新文章 url（用于最后统一并发抓正文，控制总时长）
  const newUrls: string[] = [];
  const backfillUrls: string[] = [];

  while (nextPosition !== null && pageCount < MAX_PAGES) {
    const page = await fetchPage(position);
    pageCount++;
    nextPosition = page.nextPosition;

    for (const item of page.list) {
      if (!item.articlePcUrl || !item.title) {
        skipped++;
        continue;
      }

      if (item.author?.name) authorName = item.author.name;
      if (item.author?.avatarUrl) authorLogo = item.author.avatarUrl;

      try {
        const existing = await prisma.news.findUnique({
          where: { url: item.articlePcUrl },
          select: { id: true, content: true },
        });

        if (existing) {
          // 已存在：只更新 crawledAt；content 为空时也回填一次
          if (!existing.content) {
            backfillUrls.push(item.articlePcUrl);
          }
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

        // 新增：content 留空（详情抓正文在批处理阶段补）
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
        newUrls.push(item.articlePcUrl);
      } catch (err: any) {
        console.error(`  跳过: ${item.articlePcUrl} (${err.message})`);
        skipped++;
      }
    }

    if (!nextPosition) break;
    position = nextPosition;
  }

  // 串行抓正文（受 Vercel 60s 限制，宁可少抓也别超时）
  // 优先级：先回填旧文章的 content，再抓新文章
  const allTargets = [...backfillUrls, ...newUrls];

  for (const url of allTargets) {
    const content = await fetchArticleContent(url);
    if (!content) continue;
    try {
      await prisma.news.update({
        where: { url },
        data: { content },
      });
      contentFilled++;
    } catch (err: any) {
      console.warn(`  [content save fail] ${url}: ${err.message}`);
    }
  }

  return { added, skipped, contentFilled, authorName, pages: pageCount, totalUrls: allTargets.length };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalContentFilled = 0;
  let lastSummary = '';

  try {
    const r = await crawlMjzj();
    totalAdded = r.added;
    totalSkipped = r.skipped;
    totalContentFilled = r.contentFilled;
    lastSummary = `mjzj[${r.authorName || '未知'}] +${r.added} / skip ${r.skipped} / pages ${r.pages} / 正文补 ${r.contentFilled}/${r.totalUrls}`;
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
    summary: `新增 ${totalAdded}，已存在 ${totalSkipped}，正文补 ${totalContentFilled}，清理过期 ${deleteResult.count}`,
    source: 'mjzj',
    details: lastSummary,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
