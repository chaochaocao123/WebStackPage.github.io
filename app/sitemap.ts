import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const SITE_URL = 'https://kjgjs.cn';

// v11.15.1 修复：去掉 force-dynamic，让 ISR + middleware 兜底 s-maxage=600 生效
// 旧写法 force-dynamic 会强制覆盖 middleware 缓存头为 max-age=0
export const revalidate = 600; // 10 分钟重生，配合 middleware s-maxage=600

/**
 * 动态 sitemap.xml
 * - 静态路由：/、/articles、/news、/deals、/tools、3 个工具子页
 * - 动态内容：所有 News / Article / Tool / Deal 详情页
 * - lastmod 用 DB 记录的 updatedAt / publishedAt
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 静态路由
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/deals`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/tools/fba-calculator`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/unit-converter`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/tools/exchange-rate`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // v11.11 P1-8 E-E-A-T 页面（站点权威性 + 信任度）
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // 动态：News
  const news = await prisma.news.findMany({
    where: { sourceType: 'crawl' },
    select: { id: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
  const newsRoutes: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${SITE_URL}/news/${n.id}`,
    lastModified: n.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 动态：Articles
  // v11.21 SEO：过滤 isReposted=true 的转载文章（已 noindex，不主动推百度）
  const articles = await prisma.article.findMany({
    where: { isReposted: false },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 动态：Tools（v11.10 新增工具详情页：70 个工具详情，长尾 SEO 入口）
  const tools = await prisma.tool.findMany({
    select: { id: true, updatedAt: true },
  });
  const toolRoutes: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${SITE_URL}/tools/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 动态：Deals（v11.10.2 新增优惠详情页：联盟营销转化页 + 限时优惠长尾）
  // 排除已过期的 deal（endDate < now）：避免收录过期优惠拖累权重
  const deals = await prisma.deal.findMany({
    where: {
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    select: { id: true, updatedAt: true },
  });
  const dealRoutes: MetadataRoute.Sitemap = deals.map((d) => ({
    url: `${SITE_URL}/deals/${d.id}`,
    lastModified: d.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticRoutes, ...newsRoutes, ...articleRoutes, ...toolRoutes, ...dealRoutes];
}
