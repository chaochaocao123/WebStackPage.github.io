// favicon 抓取可行性测试
import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const p = new PrismaClient();

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface FaviconResult {
  tool: string;
  url: string;
  status: 'ok' | 'no-link' | 'failed' | 'too-small';
  resolvedUrl?: string;
  sizeBytes?: number;
  contentType?: string;
  source: 'html-link' | 'fallback-root' | 'fallback-ddgo' | 'none';
  error?: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000, method: 'GET' | 'HEAD' = 'GET') {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
      signal: controller.signal,
      redirect: 'follow',
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}

function toAbsoluteUrl(maybeRelative: string, baseUrl: string): string {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function probeFavicon(toolUrl: string): Promise<{
  source: 'html-link' | 'fallback-root' | 'fallback-ddgo' | 'none';
  url?: string;
  sizeBytes?: number;
  contentType?: string;
  error?: string;
}> {
  // 1) fetch HTML，解析 favicon link
  try {
    const htmlRes = await fetchWithTimeout(toolUrl, 8000);
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const $ = cheerio.load(html);
      const candidates: { url: string; weight: number }[] = [];
      $('link[rel*="icon"]').each((_, el) => {
        const rel = ($(el).attr('rel') || '').toLowerCase();
        const href = $(el).attr('href');
        if (!href) return;
        let weight = 1;
        if (rel.includes('apple-touch-icon')) weight = 5;
        else if (rel.includes('shortcut')) weight = 2;
        else if (rel.includes('icon')) {
          const sizes = $(el).attr('sizes') || '';
          if (sizes.includes('32') || sizes.includes('64') || sizes.includes('128') || sizes.includes('192') || sizes.includes('256')) weight = 4;
          else weight = 3;
        }
        const abs = toAbsoluteUrl(href, toolUrl);
        candidates.push({ url: abs, weight });
      });
      candidates.sort((a, b) => b.weight - a.weight);
      for (const cand of candidates) {
        try {
          const r = await fetchWithTimeout(cand.url, 5000, 'HEAD');
          if (r.ok) {
            const ct = r.headers.get('content-type') || 'image/x-icon';
            const cl = parseInt(r.headers.get('content-length') || '0', 10);
            if (cl >= 100) {
              return { source: 'html-link', url: cand.url, sizeBytes: cl, contentType: ct };
            }
          }
        } catch {}
      }
    }
  } catch (e: any) {}

  // 2) fallback: /favicon.ico
  try {
    const root = new URL(toolUrl).origin;
    const r = await fetchWithTimeout(root + '/favicon.ico', 5000, 'HEAD');
    if (r.ok) {
      const cl = parseInt(r.headers.get('content-length') || '0', 10);
      const ct = r.headers.get('content-type') || 'image/x-icon';
      if (cl >= 100) {
        return { source: 'fallback-root', url: root + '/favicon.ico', sizeBytes: cl, contentType: ct };
      }
    }
  } catch {}

  // 3) fallback: DuckDuckGo favicon service
  const domain = extractDomain(toolUrl);
  if (domain) {
    return { source: 'fallback-ddgo', url: `https://icons.duckduckgo.com/ip3/${domain}.ico` };
  }

  return { source: 'none', error: 'all strategies failed' };
}

async function main() {
  const testIds = [39, 24, 11, 6, 51]; // 紫鸟, 选品工具, 快蜗牛, Shulex, echotik
  const tools = await p.tool.findMany({
    where: { id: { in: testIds } },
    select: { id: true, name: true, url: true },
  });

  console.log(`测试 ${tools.length} 个工具的 favicon 抓取：\n`);
  const results: FaviconResult[] = [];

  for (const t of tools) {
    console.log(`[${t.id}] ${t.name} (${t.url})`);
    const probe = await probeFavicon(t.url);
    if (probe.url) {
      console.log(`  OK source: ${probe.source}`);
      console.log(`  url: ${probe.url}`);
      if (probe.sizeBytes) console.log(`  size: ${probe.sizeBytes}B  type: ${probe.contentType}`);
      results.push({
        tool: t.name, url: t.url, status: 'ok',
        source: probe.source, resolvedUrl: probe.url,
        sizeBytes: probe.sizeBytes, contentType: probe.contentType,
      });
    } else {
      console.log(`  FAIL: ${probe.error}`);
      results.push({ tool: t.name, url: t.url, status: 'failed', source: probe.source, error: probe.error });
    }
    console.log();
  }

  console.log('\n=== 汇总 ===');
  const ok = results.filter(r => r.status === 'ok').length;
  console.log(`成功: ${ok}/${results.length}`);
  console.log('source 分布:');
  const bySource: Record<string, number> = {};
  results.forEach(r => bySource[r.source] = (bySource[r.source] || 0) + 1);
  console.log(bySource);

  await p.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
