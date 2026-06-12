import type { MetadataRoute } from 'next';

const SITE_URL = 'https://kjgjs.cn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
      // 百度单独规则：允许抓 /admin 内部链接（百度更激进收录）
      // 注：仍禁止 /admin 实际页面
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
