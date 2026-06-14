/**
 * v11.20 公众号文章 URL 一键抓取代理
 * 流程：浏览器 POST { url } → 服务端选 fetcher（新榜/gs-one/本地代理）→ proxify → JSON
 *
 * v11.20 升级：
 *  - 引入 lib/wechat-fetchers 抽象层，支持 NEWRANK_API_KEY（新榜）/ LOCAL_PROXY_URL（本地代理）切换
 *  - 默认按 newrank → local → gsone 顺序自动选
 *  - 保留 runtime='nodejs'（与 actions.ts 一致，prisma 不能 edge）
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchWechatArticle, FetcherError, WechatArticle } from '@/lib/wechat-fetchers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const url = (body.url || '').trim();
  if (!url) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }

  const newrankKey = process.env.NEWRANK_API_KEY;
  const localProxyUrl = process.env.LOCAL_PROXY_URL;
  // 显式 WECHAT_FETCHER 可强制选哪条路径（newrank/gsone/local），不传走自动
  const explicit = process.env.WECHAT_FETCHER as
    | 'newrank'
    | 'gsone'
    | 'local'
    | undefined;

  const result = await fetchWechatArticle(url, {
    fetcher: explicit,
    newrankKey,
    localProxyUrl,
  });

  // 错误分支
  if ('error' in result) {
    const err = result as FetcherError;
    // 未配置 key 的情况给更友好的提示
    if (err.error.includes('未配置') && err.error.includes('NEWRANK_API_KEY')) {
      return NextResponse.json(
        {
          error:
            '未配置新榜 API Key。请在 Vercel 后台 Environment Variables 添加 NEWRANK_API_KEY（去 newrank.cn 注册拿 Key）',
          detail: err.detail,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.error, detail: err.detail, rawHead: err.rawHead }, { status: 502 });
  }

  return NextResponse.json(result as WechatArticle);
}
