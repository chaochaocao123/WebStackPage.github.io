/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // v5 性能：给首页加 Vercel CDN 缓存头
  // - s-maxage=60：CDN（首尔边缘 icn1）缓存 60s，国内访问直接命中不再回 iad1 跑 SSR
  // - stale-while-revalidate=600：缓存过期后 10 分钟内用旧 HTML 顶住，同时后台重新生成
  // - max-age=0：浏览器不缓存（首页内容变动频繁，浏览器直接拿 CDN 的最新）
  // - ISR revalidate=300：源头每 5 分钟重新生成（fallback）
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' },
        ],
      },
      // sitemap/robots 每次都跑但内容相对稳定，加 s-maxage
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=1200' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=1200' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
