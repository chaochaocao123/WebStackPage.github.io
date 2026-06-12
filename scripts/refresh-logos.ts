// 批量刷新所有工具的 logo URL
// 策略：HTML link → /favicon.ico → DuckDuckGo favicon 服务
// 存储：Tool.logo 存 URL 字符串（next/image 远程加载）
// 并发：5（避免触发目标站点 rate limit）
// 超时：HTML 8s / favicon 5s

import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import { performance } from 'perf_hooks';

const p = new PrismaClient();

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = 5;
const HTML_TIMEOUT = 8000;
const FAVICON_TIMEOUT = 5000;
const MAX_FAVICON_SIZE = 200 * 1024; // 200KB

interface ProbeResult {
  url?: string;
  source: 'html-link' | 'fallback-root' | 'fallback-ddgo' | 'none';
  sizeBytes?: number;
  contentType?: string;
  error?: string;
}

async function fetchWithTimeout(url: string, timeoutMs: number, method: 'GET' | 'HEAD' = 'GET') {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      headers: { 'User-Agent': UA, Accept: method === 'HEAD' ? 'image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,image/*,*/*;q=0.8' },
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(tid);
  }
}

function toAbsoluteUrl(maybeRelative: string, baseUrl: string): string {
  try { return new URL(maybeRelative, baseUrl).toString(); } catch { return maybeRelative; }
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

async function probeFavicon(toolUrl: string): Promise<ProbeResult> {
  // 1) HTML link
  try {
    const htmlRes = await fetchWithTimeout(toolUrl, HTML_TIMEOUT);
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const $ = cheerio.load(html);
      const candidates: { url: string; weight: number }[] = [];
      $('link[rel*="icon"]').each((_, el) => {
        const rel = ($(el).attr('rel') || '').toLowerCase();
        const href = $(el).attr('href');
        if (!href || href.startsWith('data:')) return;
        let weight = 1;
        if (rel.includes('apple-touch-icon')) weight = 5;
        else if (rel.includes('shortcut')) weight = 2;
        else if (rel.includes('icon')) {
          const sizes = $(el).attr('sizes') || '';
          if (/(\b|^)(32|64|128|192|256|512)(\b|$)/.test(sizes)) weight = 4;
          else weight = 3;
        }
        candidates.push({ url: toAbsoluteUrl(href, toolUrl), weight });
      });
      candidates.sort((a, b) => b.weight - a.weight);
      for (const cand of candidates) {
        try {
          const r = await fetchWithTimeout(cand.url, FAVICON_TIMEOUT, 'HEAD');
          if (r.ok) {
            const cl = parseInt(r.headers.get('content-length') || '0', 10);
            const ct = r.headers.get('content-type') || 'image/x-icon';
            // 允许未知 size（没 content-length），或已知且 <= 200KB
            if (cl === 0 || cl <= MAX_FAVICON_SIZE) {
              return { url: cand.url, source: 'html-link', sizeBytes: cl, contentType: ct };
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 2) /favicon.ico
  try {
    const root = new URL(toolUrl).origin;
    const r = await fetchWithTimeout(root + '/favicon.ico', FAVICON_TIMEOUT, 'HEAD');
    if (r.ok) {
      const cl = parseInt(r.headers.get('content-length') || '0', 10);
      const ct = r.headers.get('content-type') || 'image/x-icon';
      if (cl === 0 || cl <= MAX_FAVICON_SIZE) {
        return { url: root + '/favicon.ico', source: 'fallback-root', sizeBytes: cl, contentType: ct };
      }
    }
  } catch {}

  // 3) DuckDuckGo
  const domain = extractDomain(toolUrl);
  if (domain) {
    return { url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, source: 'fallback-ddgo' };
  }

  return { source: 'none', error: 'all strategies failed' };
}

async function main() {
  const tools = await p.tool.findMany({
    select: { id: true, name: true, url: true, logo: true },
    orderBy: { id: 'asc' },
  });

  console.log(`开始刷新 ${tools.length} 个工具的 logo...\n`);
  const t0 = performance.now();

  // 1) 并发抓
  const results: Array<{
    id: number; name: string; url: string; oldLogo: string | null;
    newLogo: string | null; source: string; sizeBytes?: number; error?: string; ms: number;
  }> = [];

  const queue = [...tools];
  async function worker() {
    while (queue.length > 0) {
      const tool = queue.shift()!;
      const ts = performance.now();
      const probe = await probeFavicon(tool.url);
      const ms = Math.round(performance.now() - ts);
      results.push({
        id: tool.id, name: tool.name, url: tool.url, oldLogo: tool.logo,
        newLogo: probe.url || null, source: probe.source,
        sizeBytes: probe.sizeBytes, error: probe.error, ms,
      });
      const tag = probe.url ? '✓' : '✗';
      console.log(`[${String(tool.id).padStart(3)}] ${tag} ${tool.name.padEnd(14)} | ${probe.source.padEnd(15)} | ${probe.url || probe.error || ''} | ${ms}ms`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(`\n抓取完成，耗时 ${elapsed}s\n`);

  // 2) 写库
  let success = 0, fail = 0, noChange = 0;
  for (const r of results) {
    if (r.newLogo && r.newLogo !== r.oldLogo) {
      await p.tool.update({ where: { id: r.id }, data: { logo: r.newLogo } });
      success++;
    } else if (r.newLogo === r.oldLogo) {
      noChange++;
    } else {
      fail++;
    }
  }
  console.log(`写入完成：成功 ${success} | 无变化 ${noChange} | 失败 ${fail}`);

  // 3) 源分布
  const bySource: Record<string, number> = {};
  results.forEach(r => bySource[r.source] = (bySource[r.source] || 0) + 1);
  console.log('source 分布:', bySource);

  // 4) 失败列表
  const failed = results.filter(r => !r.newLogo);
  if (failed.length > 0) {
    console.log(`\n失败列表（${failed.length}）：`);
    failed.forEach(r => console.log(`  [${r.id}] ${r.name} (${r.url}): ${r.error}`));
  }

  await p.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
