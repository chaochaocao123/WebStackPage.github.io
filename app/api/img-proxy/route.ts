/**
 * 公众号图床代理路由
 * 用途：让 kjgjs.cn 站点能正常显示 mmbiz.qpic.cn / mmbiz.qlogo.cn 图片
 * 原理：服务端 fetch 时加 Referer: https://mp.weixin.qq.com/ 绕过防盗链
 *
 * 用法：<img src="/api/img-proxy?url=https://mmbiz.qpic.cn/xxx">
 *
 * 安全：白名单只允许微信图床域名
 * 缓存：s-maxage=604800（7 天 CDN 缓存）+ 浏览器 1 天
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';        // 用 nodejs runtime 跑 fetch
export const dynamic = 'force-dynamic'; // 走动态流（图片二进制不能被 Next 静态化）

const ALLOWED_HOSTS = [
  'mmbiz.qpic.cn',
  'mmbiz.qlogo.cn',
  'wx.qpic.cn',
];

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/svg+xml', 'image/avif', 'image/bmp',
]);

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'missing url' }, { status: 400 });
  }

  // 安全：解析 URL，校验域名
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json(
      { error: `host ${parsed.hostname} not allowed` },
      { status: 403 }
    );
  }
  if (parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'only https allowed' }, { status: 400 });
  }

  // 抓取：模拟微信客户端
  let resp: Response;
  try {
    resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mp.weixin.qq.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      // 30s 超时（Vercel 默认 30s function timeout）
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'fetch failed', detail: String(e) },
      { status: 502 }
    );
  }

  if (!resp.ok) {
    return NextResponse.json(
      { error: `upstream ${resp.status}` },
      { status: resp.status }
    );
  }

  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  // 二次校验：content-type 必须是图片
  const ctBase = contentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(ctBase)) {
    return NextResponse.json(
      { error: `content-type ${ctBase} not allowed` },
      { status: 403 }
    );
  }

  const buf = await resp.arrayBuffer();

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, s-maxage=604800, max-age=86400, stale-while-revalidate=2592000', // 7 天 CDN + 1 天浏览器 + 30 天 SWR
      'X-Proxied-From': parsed.hostname,
    },
  });
}
