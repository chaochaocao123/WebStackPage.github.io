// 跨境工具说 - 友情链接数据访问层
// v11.31 新增：曹总手动维护友链，前台 /links 展示 + 后台 /admin/friends CRUD
// 最后更新：2026-06-14

import { prisma } from '@/lib/db';

export interface FriendLink {
  id: number;
  name: string;
  url: string;
  description: string | null;
  category: string;
  logo: string | null;
  sort: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 获取全量友链（后台管理用，按 sort 升序 + category 升序）
 */
export async function getAllFriendLinks(): Promise<FriendLink[]> {
  const rows = await prisma.friendLink.findMany({
    orderBy: [{ sort: 'asc' }, { category: 'asc' }, { id: 'asc' }],
  });
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    url: r.url,
    description: r.description,
    category: r.category,
    logo: r.logo,
    sort: r.sort,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * 获取启用的友链（前台展示用，仅 isActive=true）
 */
export async function getActiveFriendLinks(): Promise<FriendLink[]> {
  const rows = await prisma.friendLink.findMany({
    where: { isActive: true },
    orderBy: [{ sort: 'asc' }, { category: 'asc' }, { id: 'asc' }],
  });
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    url: r.url,
    description: r.description,
    category: r.category,
    logo: r.logo,
    sort: r.sort,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/**
 * 按 category 分组（前台 /links 页用）
 * 返回结构：{ '热门链接': [友链数组], '跨境综合': [友链数组], ... }
 */
export async function getFriendLinksGroupedByCategory(): Promise<Record<string, FriendLink[]>> {
  const links = await getActiveFriendLinks();
  const grouped: Record<string, FriendLink[]> = {};
  for (const link of links) {
    if (!grouped[link.category]) {
      grouped[link.category] = [];
    }
    grouped[link.category].push(link);
  }
  return grouped;
}
