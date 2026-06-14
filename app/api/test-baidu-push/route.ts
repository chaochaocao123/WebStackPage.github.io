import { NextRequest, NextResponse } from 'next/server';

// v11.25 一次性测试 endpoint：验证 Vercel Function 能否直连 data.zz.baidu.com
// 路径：GET/POST /api/test-baidu-push
// 行为：直接 fetch http://data.zz.baidu.com/urls?site=kjgjs.cn&token=xxx POST 一个 URL
// 目的：测 Vercel 出口网络（出口在 AWS 美东，国内服务 data.zz.baidu.com 可能被墙/风控拒接）
// 用完即删（v11.26 删），不污染生产代码
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // 显式 nodejs（避免 edge runtime 撞 fetch 限制）

export async function GET(req: NextRequest) {
  return testBaiduPush();
}

export async function POST(req: NextRequest) {
  return testBaiduPush();
}

async function testBaiduPush() {
  const token = process.env.BAIDU_PUSH_TOKEN;
  const proxyUrl = process.env.LOCAL_PROXY_URL;
  const startTime = Date.now();

  if (!token) {
    return NextResponse.json({
      ok: false,
      stage: 'env',
      message: '未配置 BAIDU_PUSH_TOKEN（Vercel 环境变量）',
      hint: '请在 Vercel dashboard → Settings → Environment Variables → Production 配 BAIDU_PUSH_TOKEN，然后 Redeploy',
    }, { status: 500 });
  }

  const url = 'https://kjgjs.cn/';
  const apiEndpoint = `http://data.zz.baidu.com/urls?site=kjgjs.cn&token=${encodeURIComponent(token)}`;
  const fetcher = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/proxy?target=baidu&token=${encodeURIComponent(token)}` : null;
  const finalUrl = fetcher || apiEndpoint;

  let res: Response;
  let fetchError: string | null = null;
  let fetchTime = 0;
  try {
    const t1 = Date.now();
    res = await fetch(finalUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: url,
      signal: AbortSignal.timeout(8000),
    });
    fetchTime = Date.now() - t1;
  } catch (e: any) {
    fetchError = e?.message || String(e);
    return NextResponse.json({
      ok: false,
      stage: 'fetch',
      message: '请求百度失败（Vercel 出口可能不通）',
      detail: fetchError,
      apiEndpoint,
      proxyUrl: proxyUrl || null,
      finalUrl,
      fetchTimeMs: Date.now() - startTime,
      hint: '如果 detail 包含 "fetch failed" / "ECONNREFUSED" / "ETIMEDOUT"，说明 Vercel 出口被墙，需要走 LOCAL_PROXY_URL 兜底（用户电脑跑 proxy.js）',
    }, { status: 500 });
  }

  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* 非 JSON */ }

  return NextResponse.json({
    ok: res.ok,
    stage: 'response',
    message: res.ok ? '百度返回响应' : `百度返回 ${res.status}`,
    apiEndpoint,
    proxyUrl: proxyUrl || null,
    finalUrl,
    fetchTimeMs: fetchTime,
    totalTimeMs: Date.now() - startTime,
    status: res.status,
    bodyText: text,
    bodyJson: parsed,
    hint: parsed?.success !== undefined
      ? `百度标准响应：成功 ${parsed.success} 条 / 剩余 ${parsed.remain} 次`
      : '返回内容非标准 JSON，可能是网络层被拦截（被百度风控识别为机器人）',
  });
}
