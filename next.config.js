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
};

module.exports = {
  ...nextConfig,
  // v11.15 www.kjgjs.cn 接入 + 301 重定向到主域 kjgjs.cn
  // 作用：避免 www 与裸域双版本被搜索引擎视为重复内容（SEO 权重分散）
  // 设计：使用 Next.js `host` 匹配，命中 www.kjgjs.cn（含所有路径）→ 308 永久跳到 kjgjs.cn
  // 注：308 = 永久 + 保留方法（vs 301 早期实现会把 POST 改 GET，308 不会）
  // 同时保留 Vercel domain 设置作为主方案，本配置作为兜底
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.kjgjs.cn',
          },
        ],
        destination: 'https://kjgjs.cn/:path*',
        permanent: true, // 308
      },
      // 兜底：部分老旧 CDN/反代可能把 Host 头改为大写，兼容一下
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'WWW.kjgjs.cn',
          },
        ],
        destination: 'https://kjgjs.cn/:path*',
        permanent: true,
      },
    ];
  },
};
