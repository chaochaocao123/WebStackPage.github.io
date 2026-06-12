// 从数据库读取工具和分类数据
// 导出与 lib/data/tools.ts 相同的接口，保持 app/page.tsx 兼容
import { prisma } from '../db';

export interface Tool {
  name: string;
  url: string;
  business: string;
  category: string;
  affiliateUrl: string;
  discount: string;
  logo?: string | null;
  featured?: boolean;
}

// 获取所有分类
export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: 'asc' },
  });

  // 统计每个分类的工具数量
  const toolsCount = await prisma.tool.groupBy({
    by: ['categoryKey'],
    _count: { id: true },
  });

  const countMap = new Map(toolsCount.map(t => [t.categoryKey, t._count.id]));
  const totalCount = await prisma.tool.count();

  const result = [
    { key: 'all', label: '全部', count: totalCount },
    ...categories.map(c => ({
      key: c.key,
      label: c.label,
      count: countMap.get(c.key) || 0,
    })),
  ];

  return result;
}

// 获取所有工具
export async function getTools() {
  const tools = await prisma.tool.findMany({
    orderBy: [{ featured: 'desc' }, { sort: 'asc' }],
  });

  return tools.map(t => ({
    name: t.name,
    url: t.url,
    business: t.business,
    category: t.categoryKey,
    affiliateUrl: t.affiliateUrl,
    discount: t.discount,
    logo: t.logo,
    featured: t.featured,
  }));
}

// 获取分类标签
export function getCategoryLabel(key: string, categories: { key: string; label: string }[]): string {
  return categories.find(c => c.key === key)?.label || key;
}

// 缓存版本，用于强制刷新
let cachedCategories: ReturnType<typeof getCategories> | null = null;
let cachedTools: ReturnType<typeof getTools> | null = null;

// CATEGORIES 和 TOOLS 直接导出（服务端组件中使用）
// 注意：这些在 Next.js 构建时会被调用
export { getCategories as CATEGORIES_LOADER, getTools as TOOLS_LOADER };
