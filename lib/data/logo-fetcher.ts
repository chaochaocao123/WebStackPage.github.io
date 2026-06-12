// 工具 logo 抓取器
// 策略：HTML link → /favicon.ico → DuckDuckGo favicon 服务
// 存储：返回 URL 字符串，由调用方写入 Tool.logo 字段
// 性能：单次抓取 1-8s，含 3 级 fallback
// 稳定性：失败返回 null，调用方决定如何处理（保留旧值 / fallback 首字母）

import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HTML_TIMEOUT = 8000;
const FAVICON_TIMEOUT = 5000;
const MAX_FAVICON_SIZE = 200 * 1024; // 200KB

export type FaviconSource = 'html-link' | 'fallback-root' | 'fallback-ddgo' | 'none';

export interface FaviconResult {
  url: string | null;
  source: FaviconSource;
  sizeBytes?: number;
  contentType?: string;
  error?: string;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  method: 'GET' | 'HEAD' = 'GET',
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      headers: {
        'User-Agent': UA,
        Accept: method === 'HEAD' ? 'image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,image/*,*/*;q=0.8',
      },
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

/**
 * 抓取工具 URL 的 favicon
 * @param toolUrl 工具官网 URL
 * @returns FaviconResult.url 抓到的 favicon URL（可直接存到 Tool.logo）；null 表示完全失败
 */
export async function fetchFavicon(toolUrl: string): Promise<FaviconResult> {
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

  // 3) DuckDuckGo favicon 服务
  const domain = extractDomain(toolUrl);
  if (domain) {
    return { url: `https://icons.duckduckgo.com/ip3/${domain}.ico`, source: 'fallback-ddgo' };
  }

  return { url: null, source: 'none', error: 'all strategies failed' };
}
