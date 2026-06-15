/**
 * 手动触发 crawl-news 抓取（绕开 Vercel Hobby cron 不可靠问题）
 * 用法：DATABASE_URL=... npx tsx scripts/manual-crawl-news.ts
 *
 * 2026-06-15 v2 修复：补 v4 title 清洗（去"卖家之家早讯 | "等前缀）
 *   - 用 lib/news-clean.ts 共享函数（与 Vercel cron route 保持一致）
 *   - 教训（决策 158）：简化抓取脚本时必须保留 v4+ 改造的清洗逻辑
 */
import { PrismaClient } from '@prisma/client';
import { cleanNewsTitle } from '../lib/news-clean';

const prisma = new PrismaClient();

const MJZJ_API = 'https://data.mjzj.com/api/article/search';
const AUTHOR_ID = '312';
const PAGE_SIZE = 20;
const MAX_PAGES = 2;
const UA = 'Mozilla/5.0 (compatible; kjgjs-bot/1.0; +https://kjgjs.cn)';

async function main() {
  console.log('🕷️  开始抓取 mjzj 资讯...');
  const startTime = Date.now();

  let added = 0;
  let skipped = 0;
  let pageCount = 0;
  let position = '';
  let nextPosition: string | null = '';

  while (nextPosition !== null && pageCount < MAX_PAGES) {
    const url = `${MJZJ_API}?authorId=${encodeURIComponent(AUTHOR_ID)}&size=${PAGE_SIZE}${
      position ? `&position=${encodeURIComponent(position)}` : ''
    }`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) {
      console.error(`❌ mjzj HTTP ${res.status}`);
      break;
    }
    const json: any = await res.json();
    const list: any[] = Array.isArray(json.list) ? json.list : [];
    nextPosition = json.nextPosition ?? null;
    pageCount++;
    console.log(`📄 第 ${pageCount} 页: ${list.length} 条`);

    for (const item of list) {
      if (!item.articlePcUrl || !item.title) {
        skipped++;
        continue;
      }
      const existing = await prisma.news.findUnique({ where: { url: item.articlePcUrl }, select: { id: true } });
      if (existing) {
        skipped++;
        continue;
      }
      const summary = (item.aiSummary || item.summary || '').trim().slice(0, 500) || null;
      const publishedAt = new Date(
        typeof item.publishDateTime?.value === 'number' ? item.publishDateTime.value : Date.now()
      );
      // 2026-06-15 v2 修复：补 v4 title 清洗（与 route.ts 保持一致）
      const rawTitle = item.title.trim().slice(0, 200);
      const cleaned = cleanNewsTitle(rawTitle);
      const finalTitle = cleaned ? cleaned.cleaned : rawTitle;
      await prisma.news.create({
        data: {
          title: finalTitle,
          url: item.articlePcUrl,
          source: 'mjzj',
          summary,
          cover: item.coverUrl || null,
          publishedAt,
          crawledAt: new Date(),
          sourceType: 'crawl',
        },
      });
      added++;
    }

    if (!nextPosition) break;
    position = nextPosition;
  }

  console.log(`✅ 抓取完成: 新增 ${added} 条，已存在 ${skipped} 条，耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
