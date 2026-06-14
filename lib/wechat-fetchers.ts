/**
 * v11.20 公众号文章抓取 fetcher 抽象
 *
 * 三种实现可切换：
 *  - newrank  新榜付费 API（需 NEWRANK_API_KEY，6u/次，按 URL 实时抓全文）
 *  - gsone    gs-one 公开 API（0 元，志愿者维护，稳定性弱，作为兜底）
 *  - local    本地 Node 代理（曹总电脑跑 proxy.js，绕过 Vercel 国内 API 出口限制）
 *
 * 选优先级（由调用方传入 opts.fetcher 覆盖）：
 *  1. opts.fetcher 显式指定
 *  2. NEWRANK_API_KEY 配置 → newrank
 *  3. LOCAL_PROXY_URL 配置 → local
 *  4. 兜底 gsone
 *
 * 设计要点：
 *  - 统一返回 WechatArticle 标准结构，调用方零分支
 *  - proxifyWechatImagesInHtml 内部统一处理 mmbiz.qpic.cn 图床
 *  - 错误返回 { error, detail? } 而非抛异常，避免污染 Server Action redirect 流程
 *  - 不做字段映射，gs-one 字段 (content_noencode) 和新榜字段 (content) 由各自 fetcher 内部归一
 */
import { proxifyWechatImagesInHtml } from './article-content-render';

const WECHAT_HOST_RE = /^https?:\/\/mp\.weixin\.qq\.com\//;

export type FetcherKind = 'newrank' | 'gsone' | 'local';

export interface WechatArticle {
  title: string;
  desc: string;
  content: string; // 已 proxify 的 HTML
  nickName: string;
  roundHeadImg: string;
  sourceUrl: string;
  publishedAt: string | null;
}

export interface FetcherError {
  error: string;
  detail?: string;
  rawHead?: string; // 前 200 字符原始响应（调试用，code 200 字段缺失时排查用）
}

export interface FetchOptions {
  fetcher?: FetcherKind;
  newrankKey?: string;
  localProxyUrl?: string;
}

const NEWRANK_API = 'https://api.newrank.cn/api/sync/weixin/data/sourceurl_content';
const GS_ONE_API = 'https://www.gs-one.cn/api/public/v1/download';
const FETCH_TIMEOUT = 60_000;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ============== 新榜 fetcher ==============
async function fetchByNewrank(
  url: string,
  key: string
): Promise<WechatArticle | FetcherError> {
  const form = new URLSearchParams();
  form.set('url', url);

  let resp: Response;
  try {
    resp = await fetch(NEWRANK_API, {
      method: 'POST',
      headers: {
        Key: key,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': UA,
        Accept: 'application/json,text/plain,*/*',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
  } catch (e) {
    return {
      error: '新榜请求失败（网络/超时）',
      detail: String(e instanceof Error ? e.message : e),
    };
  }

  const rawText = await resp.text();
  const rawHead = rawText.slice(0, 200);

  if (!resp.ok) {
    return { error: `新榜上游 HTTP ${resp.status}`, rawHead };
  }

  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch {
    return { error: '新榜返回的不是合法 JSON', rawHead };
  }

  // 新榜业务码：成功时 code === 0
  if (json?.code !== 0) {
    return {
      error: `新榜抓取失败: ${json?.msg || 'unknown'} (code: ${json?.code})`,
      rawHead,
    };
  }

  // 新榜接口数据可能挂在 json.data 或直接挂在 json 上
  const data = json.data || json;
  const title = (data.title || '').toString().trim();
  const content = (data.content || data.content_noencode || '').toString();
  if (!title || !content) {
    return {
      error: '新榜返回数据缺少 title/content（可能文章未被新榜采集/已删除）',
      rawHead,
    };
  }

  return {
    title,
    desc: (data.digest || data.desc || '').toString(),
    content: proxifyWechatImagesInHtml(content),
    nickName: (data.wx_name || data.nick_name || data.author_name || '').toString(),
    roundHeadImg: (data.round_head_img || data.head_img || '').toString(),
    sourceUrl: url,
    publishedAt: data.publish_time
      ? new Date(Number(data.publish_time) * 1000).toISOString()
      : data.update_time
      ? new Date(Number(data.update_time) * 1000).toISOString()
      : null,
  };
}

// ============== gs-one fetcher（v11.19 兜底） ==============
async function fetchByGsOne(url: string): Promise<WechatArticle | FetcherError> {
  const gsUrl = `${GS_ONE_API}?url=${encodeURIComponent(url)}&format=json`;
  let resp: Response;
  try {
    resp = await fetch(gsUrl, {
      headers: { 'User-Agent': UA, Accept: 'application/json,text/plain,*/*' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
  } catch (e) {
    return {
      error: 'gs-one 请求失败（网络/超时）',
      detail: String(e instanceof Error ? e.message : e),
    };
  }

  if (!resp.ok) {
    return { error: `gs-one 上游 HTTP ${resp.status}` };
  }

  let data: any;
  try {
    data = await resp.json();
  } catch {
    return { error: 'gs-one 返回的不是合法 JSON' };
  }

  if (data?.base_resp?.ret !== 0) {
    return {
      error: `gs-one 抓取失败: ${data?.base_resp?.errmsg || 'unknown'} (code: ${data?.base_resp?.ret})`,
    };
  }
  if (!data?.title || !data?.content_noencode) {
    return { error: 'gs-one 返回缺少 title/content_noencode（可能文章已被删除）' };
  }

  return {
    title: data.title,
    desc: data.desc || '',
    content: proxifyWechatImagesInHtml(data.content_noencode),
    nickName: data.nick_name || '',
    roundHeadImg: data.round_head_img || '',
    sourceUrl: url,
    publishedAt: data.create_time
      ? new Date(data.create_time * 1000).toISOString()
      : null,
  };
}

// ============== 本地代理 fetcher（v11.20 新增兜底） ==============
async function fetchByLocal(
  url: string,
  proxyUrl: string
): Promise<WechatArticle | FetcherError> {
  // proxyUrl 例如 http://127.0.0.1:9527/fetch?url=...
  const target = `${proxyUrl}?url=${encodeURIComponent(url)}`;
  let resp: Response;
  try {
    resp = await fetch(target, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
  } catch (e) {
    return {
      error: '本地代理请求失败（确认 proxy.js 已运行）',
      detail: String(e instanceof Error ? e.message : e),
    };
  }

  if (!resp.ok) {
    return { error: `本地代理 HTTP ${resp.status}` };
  }

  const data = (await resp.json()) as WechatArticle | { error: string };
  if ('error' in data) {
    return { error: `本地代理: ${data.error}` };
  }
  // proxify 兜底一遍（万一 proxy 不走 proxify）
  return {
    ...data,
    content: proxifyWechatImagesInHtml(data.content),
    sourceUrl: url,
  };
}

// ============== 主入口 ==============
export async function fetchWechatArticle(
  url: string,
  opts: FetchOptions = {}
): Promise<WechatArticle | FetcherError> {
  if (!WECHAT_HOST_RE.test(url)) {
    return { error: '只支持 mp.weixin.qq.com 域链接（公众号文章）' };
  }

  // 显式 fetcher 优先
  const explicit = opts.fetcher;

  if (explicit === 'newrank') {
    if (!opts.newrankKey) return { error: '未配置 NEWRANK_API_KEY（Vercel Environment Variables）' };
    return fetchByNewrank(url, opts.newrankKey);
  }
  if (explicit === 'gsone') return fetchByGsOne(url);
  if (explicit === 'local') {
    if (!opts.localProxyUrl) return { error: '未配置 LOCAL_PROXY_URL' };
    return fetchByLocal(url, opts.localProxyUrl);
  }

  // 自动选：newrank > local > gsone
  if (opts.newrankKey) return fetchByNewrank(url, opts.newrankKey);
  if (opts.localProxyUrl) return fetchByLocal(url, opts.localProxyUrl);
  return fetchByGsOne(url);
}
