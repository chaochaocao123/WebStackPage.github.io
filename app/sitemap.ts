import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const SITE_URL = 'https://kjgjs.cn';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 小时重生

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
  const articles = await prisma.article.findMany({
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

  // 注意：Deal 详情页 /deals/[id] 尚未实现，待 v11.11 启用
  // const deals = await prisma.deal.findMany({ ... });
  // const dealRoutes: MetadataRoute.Sitemap = deals.map(...);

  return [...staticRoutes, ...newsRoutes, ...articleRoutes, ...toolRoutes];
}
