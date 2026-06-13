// v11.11 P1-6 内链优化：详情页「相关内容」共享组件 + 数据查询
// 给 Tool 详情页加「相关资讯 + 相关文章 + 相关优惠」交叉内链
// 给 Article/News 详情页加「推荐工具」交叉内链

import { prisma } from '@/lib/db';

const SITE_URL = 'https://kjgjs.cn';

/** Tool 详情页：按 category 拉同分类的 6 个相关 Tool */
export async function getRelatedToolsByCategory(categoryKey: string, excludeId: number) {
  return prisma.tool.findMany({
    where: {
      categoryKey,
      id: { not: excludeId },
    },
    orderBy: [{ featured: 'desc' }, { sort: 'asc' }, { id: 'asc' }],
    take: 6,
    select: {
      id: true,
      name: true,
      url: true,
      business: true,
      categoryKey: true,
      affiliateUrl: true,
      discount: true,
      logo: true,
      featured: true,
    },
  });
}

/** Tool 详情页：按 brand 拉相关的 Deal（同品牌优惠） */
export async function getRelatedDealsByBrand(brand: string, excludeToolId: number) {
  // 从 deal 表查同 brand 的 deal（不分页，全部返回；通常 1-2 条）
  const deals = await prisma.deal.findMany({
    where: {
      brand,
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });
  return deals;
}

/** Tool 详情页：按 category 拉相关的 5 条 News */
export async function getRelatedNewsByCategory(categoryKey: string) {
  // 尝试匹配 category 字段（news 表有 category 字段存「ERP管理」等中文标签）
  return prisma.news.findMany({
    where: {
      category: { contains: categoryKey.split(/[·\/]/)[0] }, // 取第一个关键词（如「ERP管理系统」取「ERP」）
    },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: { id: true, title: true, category: true, source: true, publishedAt: true },
  });
}

/** Tool 详情页：按 category 拉相关的 5 条 Article */
export async function getRelatedArticlesByCategory(categoryKey: string) {
  // articles 表有 category 字段
  return prisma.article.findMany({
    where: {
      category: { contains: categoryKey.split(/[·\/]/)[0] },
    },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: { id: true, slug: true, title: true, category: true, publishedAt: true },
  });
}

/** Article/News 详情页：拉推荐工具（按 category 拉 6 个） */
export async function getRecommendedToolsByCategory(categoryLabel: string) {
  if (!categoryLabel) return [];
  // 提取第一个关键词
  const keyword = categoryLabel.split(/[·\/、]/)[0].trim();
  if (!keyword) return [];

  return prisma.tool.findMany({
    where: {
      OR: [
        { categoryKey: { contains: keyword } },
        { business: { contains: keyword } },
      ],
    },
    orderBy: [{ featured: 'desc' }, { sort: 'asc' }, { id: 'asc' }],
    take: 6,
    select: {
      id: true,
      name: true,
      url: true,
      business: true,
      categoryKey: true,
      affiliateUrl: true,
      discount: true,
      logo: true,
      featured: true,
    },
  });
}

export { SITE_URL };
