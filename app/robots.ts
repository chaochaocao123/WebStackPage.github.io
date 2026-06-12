import type { MetadataRoute } from 'next';

const SITE_URL = 'https://kjgjs.cn';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ===== 默认（通配所有爬虫）=====
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/'],
        // 5 秒间隔：避免被爬虫瞬时大量请求拖慢 Vercel Hobby
        crawlDelay: 5,
      },

      // ===== Googlebot =====
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api/'],
        crawlDelay: 0, // Google 自带智能调度，不强制延迟
      },

      // ===== Googlebot-Image（图片搜索引擎专用）=====
      {
        userAgent: 'Googlebot-Image',
        allow: ['/images/', '/news/'],   // 允许抓 mjzj 封面
        disallow: ['/admin', '/api/'],
      },

      // ===== Bingbot =====
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin', '/api/'],
        crawlDelay: 5,
      },

      // ===== Baiduspider（百度）=====
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/admin', '/api/'],
        // 10 秒间隔：百度抓取压力极大，Hobby plan 必加延迟
        crawlDelay: 10,
      },

      // ===== 360Spider（360 搜索）=====
      {
        userAgent: '360Spider',
        allow: '/',
        disallow: ['/admin', '/api/'],
        crawlDelay: 10,
      },

      // ===== Sogou Spider（搜狗）=====
      {
        userAgent: 'Sogou web spider',
        allow: '/',
        disallow: ['/admin', '/api/'],
        crawlDelay: 10,
      },

      // ===== 字节 Bytedance（西瓜/头条搜索）=====
      {
        userAgent: 'Bytespider',
        allow: '/',
        disallow: ['/admin', '/api/'],
        crawlDelay: 20, // 字节爬虫极激进，强制 20s
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
