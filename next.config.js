/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    // v11.15.3 P2-15 JS chunk 优化：自动重写 lucide-react/clsx/tailwind-merge 的 barrel 文件
    // 让 tree-shaking 更彻底，首屏 JS 预计减少 20-30KB
    // 官方文档：https://nextjs.org/docs/app/api-reference/next-config-js/optimizePackageImports
    optimizePackageImports: ['lucide-react', 'clsx', 'tailwind-merge'],
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
