import { NextResponse, type NextRequest } from 'next/server';

// v5 性能：给首页 + sitemap/robots 加 Vercel CDN 缓存头
// - s-maxage=60：CDN（首尔边缘 icn1）缓存 60s，国内访问直接命中不再回 iad1 跑 SSR
// - stale-while-revalidate=600：缓存过期后 10 分钟内用旧 HTML 顶住，同时后台重新生成
// - max-age=0：浏览器不缓存（首页内容变动频繁，浏览器直接拿 CDN 的最新）
// - ISR revalidate=300：源头每 5 分钟重新生成（fallback）

// v11.11 P1-7 安全头（OWASP 推荐，给所有页面加）：
// - X-Content-Type-Options: nosniff —— 防 MIME 嗅探
// - X-Frame-Options: SAMEORIGIN —— 防 clickjacking（admin iframe 用 same-origin 兼容）
// - Referrer-Policy: strict-origin-when-cross-origin —— 防 referrer 泄漏内部 URL
// - Permissions-Policy: 关掉不需要的浏览器 API（相机/麦克风/地理/FLoC 追踪）
// - Cross-Origin-Opener-Policy: same-origin —— 防 Spectre 类侧信道攻击
//
// Vercel 默认已加 Strict-Transport-Security（HSTS，2 年），这里不再重复
function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // 不用 DENY：admin 后台 iframe 内嵌图表/弹窗需要 SAMEORIGIN
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // 禁用不必要 API（kjgjs 是内容站，不需要相机/麦克风/地理/FLoC 追踪）
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()'
  );
  // 跨窗口隔离（防 Spectre）
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    setSecurityHeaders(response);
    return response;
  }

  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    setSecurityHeaders(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // v11.11 P1-7：扩 matcher 到所有公开页面（除 admin/api/内部资源/static/图标）
  // 公开页统一加安全头；admin/api 路径不加（admin iframe 需 same-origin，但 admin 单独安全策略后续做）
  matcher: [
    '/',
    '/sitemap.xml',
    '/robots.txt',
    '/((?!admin|api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$|indexnow-).*)',
  ],
};
