/**
 * v11.19 公众号文章 URL 一键抓取代理
 * 流程：浏览器 POST { url } → 服务端调 gs-one API → 规范化(proxify 图片) → 返回 JSON
 * 用途：把"粘链接"模式的公众号抓取代理到 Vercel 后端
 *
 * 设计要点：
 *  - 服务端 fetch gs-one 避开浏览器 CORS 限制
 *  - 复用 v11.17 的 proxifyWechatImagesInHtml 兜底图床 URL
 *  - 60s 超时（公众号文章较长，留足缓冲）
 *  - 不缓存（每次抓取都是新内容）
 */
import { NextRequest, NextResponse } from 'next/server';
import { proxifyWechatImagesInHtml } from '@/lib/article-content-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GS_ONE_API = 'https://www.gs-one.cn/api/public/v1/download';
const WECHAT_HOST_RE = /^https?:\/\/mp\.weixin\.qq\.com\//;

interface GsOneResponse {
  base_resp?: { ret: number; errmsg: string };
  user_name?: string;
  nick_name?: string;
  round_head_img?: string;
  title?: string;
  desc?: string;
  content_noencode?: string;
  create_time?: number;
  update_time?: number;
}

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
  if (!WECHAT_HOST_RE.test(url)) {
    return NextResponse.json(
      { error: '只支持 mp.weixin.qq.com 域链接（公众号文章）' },
      { status: 400 }
    );
  }

  // 调 gs-one 公开 API（不需要鉴权）
  const gsUrl = `${GS_ONE_API}?url=${encodeURIComponent(url)}&format=json`;
  let resp: Response;
  try {
    resp = await fetch(gsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*',
      },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'gs-one 请求失败（网络/超时）', detail: String(e) },
      { status: 502 }
    );
  }

  if (!resp.ok) {
    return NextResponse.json(
      { error: `gs-one 上游返回 ${resp.status}` },
      { status: resp.status }
    );
  }

  let data: GsOneResponse;
  try {
    data = (await resp.json()) as GsOneResponse;
  } catch {
    return NextResponse.json(
      { error: 'gs-one 返回的不是合法 JSON' },
      { status: 502 }
    );
  }

  // 校验 gs-one 业务状态
  const ret = data.base_resp?.ret;
  if (ret !== 0) {
    const errmsg = data.base_resp?.errmsg || 'unknown error';
    return NextResponse.json(
      { error: `gs-one 抓取失败: ${errmsg} (code: ${ret})` },
      { status: 422 }
    );
  }

  if (!data.title || !data.content_noencode) {
    return NextResponse.json(
      { error: 'gs-one 返回数据缺少 title 或 content 字段，可能文章不存在/被删' },
      { status: 422 }
    );
  }

  // 图片 URL 走代理（mmbiz.qpic.cn → /api/img-proxy）
  const contentProxified = proxifyWechatImagesInHtml(data.content_noencode);

  return NextResponse.json({
    ok: true,
    title: data.title,
    desc: data.desc || '',
    content: contentProxified,
    nickName: data.nick_name || '',
    roundHeadImg: data.round_head_img || '',
    sourceUrl: url,
    publishedAt: data.create_time
      ? new Date(data.create_time * 1000).toISOString()
      : null,
  });
}
