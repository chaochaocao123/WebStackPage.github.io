// 移动端 API（kjgjs 配套小程序 · 决策 216 候选 · 6-17）
// 单一端点：GET /api/mobile/[type]
//   type = tools | deals（核心 2 tab）
//   query: page / pageSize / category / search / featured / id
// 统一响应：{ success, data, total, page, pageSize, hasMore }
// 安全：MVP 阶段匿名访问；后期接微信 wx.login 后再加鉴权
// 2026-06-17 v3 简化（曹总 18:37）：小程序 2 tab 极简方案
//   ✅ tools：工具列表（核心 1）
//   ✅ deals：工具优惠（核心 2）
//   ❌ news / articles：弱化，小程序不调（API 暂留，方便以后扩展）
//   ❌ wechat：删除（v2 误判，公众号列表 = 工具的列表，不是公众号）

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

interface MobileListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  meta?: {
    categories?: { key: string; label: string; count: number }[];
    brands?: { name: string; logo: string | null; count: number }[];
  };
}

function clampPageSize(input: string | null): number {
  const n = Number(input ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.floor(n));
}

function clampPage(input: string | null): number {
  const n = Number(input ?? 1);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.floor(n);
}

function json<T>(payload: MobileListResponse<T>, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

function err(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message, data: [], total: 0, page: 1, pageSize: 0, hasMore: false },
    { status }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const { type } = params;
  const { searchParams } = new URL(request.url);

  const detailId = searchParams.get('id');
  if (detailId) {
    return getDetail(type, Number(detailId));
  }

  const page = clampPage(searchParams.get('page'));
  const pageSize = clampPageSize(searchParams.get('pageSize'));
  const category = searchParams.get('category')?.trim() || undefined;
  const search = searchParams.get('search')?.trim() || undefined;
  const featured = searchParams.get('featured');

  try {
    switch (type) {
      case 'tools':
        return await listTools(page, pageSize, category, search, featured);
      case 'deals':
        return await listDeals(page, pageSize, category, search);
      case 'news':
        // 弱化保留 · 小程序不调
        return await listNews(page, pageSize, category, search);
      case 'articles':
        // 弱化保留 · 小程序不调
        return await listArticles(page, pageSize, category, search);
      default:
        return err(`Unknown type: ${type}`);
    }
  } catch (e: any) {
    console.error(`[mobile/${type}] list error:`, e);
    return err(e?.message || 'Internal error', 500);
  }
}

// ========== tools ==========
async function listTools(
  page: number,
  pageSize: number,
  category: string | undefined,
  search: string | undefined,
  featured: string | null
) {
  const where: any = {};
  if (category) where.categoryKey = category;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { business: { contains: search } },
    ];
  }
  if (featured === '1' || featured === 'true') where.featured = true;

  const [total, rows, categories] = await Promise.all([
    prisma.tool.count({ where }),
    prisma.tool.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { sort: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.tool.groupBy({
      by: ['categoryKey'],
      _count: { _all: true },
      orderBy: { categoryKey: 'asc' },
    }),
  ]);

  const catKeys = categories.map(c => c.categoryKey);
  const catMap = new Map(
    catKeys.length
      ? (await prisma.category.findMany({ where: { key: { in: catKeys } }, select: { key: true, label: true } }))
          .map(c => [c.key, c.label])
      : []
  );

  const data = rows.map(r => ({
    id: r.id,
    name: r.name,
    url: r.url,
    affiliateUrl: r.affiliateUrl,
    business: r.business,
    categoryKey: r.categoryKey,
    categoryLabel: catMap.get(r.categoryKey) || r.categoryKey,
    discount: r.discount,
    logo: r.logo || null,
    featured: r.featured,
  }));

  return json({
    success: true,
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    meta: {
      categories: categories.map(c => ({
        key: c.categoryKey,
        label: catMap.get(c.categoryKey) || c.categoryKey,
        count: c._count._all,
      })),
    },
  });
}

// ========== news（弱化）==========
async function listNews(
  page: number,
  pageSize: number,
  category: string | undefined,
  search: string | undefined
) {
  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { summary: { contains: search } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, title: true, summary: true, cover: true,
        source: true, sourceLogo: true, category: true,
        publishedAt: true, pinned: true,
      },
    }),
  ]);

  const data = rows.map(r => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    cover: r.cover || null,
    source: r.source,
    sourceLogo: r.sourceLogo || null,
    category: r.category,
    publishedAt: r.publishedAt.toISOString(),
    pinned: r.pinned,
  }));

  return json({ success: true, data, total, page, pageSize, hasMore: page * pageSize < total });
}

// ========== deals（核心 1）==========
async function listDeals(
  page: number,
  pageSize: number,
  category: string | undefined,
  search: string | undefined
) {
  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ];
  }

  const [total, rows, brands] = await Promise.all([
    prisma.deal.count({ where }),
    prisma.deal.findMany({
      where,
      orderBy: [{ endDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, title: true, url: true, brand: true, brandLogo: true,
        category: true, discount: true, description: true,
        startDate: true, endDate: true, source: true,
      },
    }),
    prisma.deal.groupBy({
      by: ['brand'],
      _count: { _all: true },
      orderBy: { brand: 'asc' },
    }),
  ]);

  const data = rows.map(r => ({
    id: r.id,
    title: r.title,
    url: r.url,
    brand: r.brand,
    brandLogo: r.brandLogo || null,
    category: r.category,
    discount: r.discount,
    description: r.description,
    startDate: r.startDate?.toISOString() || null,
    endDate: r.endDate?.toISOString() || null,
    source: r.source,
  }));

  return json({
    success: true,
    data,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    meta: {
      brands: brands.map(b => ({ name: b.brand, logo: null, count: b._count._all })),
    },
  });
}

// ========== articles（弱化）==========
async function listArticles(
  page: number,
  pageSize: number,
  category: string | undefined,
  search: string | undefined
) {
  const where: any = { status: 'published' };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, slug: true, title: true, excerpt: true, cover: true,
        category: true, publishedAt: true, viewCount: true,
      },
    }),
  ]);

  const data = rows.map(r => ({
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt,
    cover: r.cover || null, category: r.category,
    publishedAt: r.publishedAt.toISOString(), viewCount: r.viewCount,
  }));

  return json({ success: true, data, total, page, pageSize, hasMore: page * pageSize < total });
}

// ========== wechat 已删除（v3 简化）==========

// ========== detail ==========
async function getDetail(type: string, id: number) {
  if (!Number.isFinite(id) || id <= 0) return err('Invalid id');

  try {
    switch (type) {
      case 'tools': {
        const t = await prisma.tool.findUnique({
          where: { id },
          select: {
            id: true, name: true, url: true, affiliateUrl: true, business: true,
            categoryKey: true, discount: true, logo: true, featured: true,
            category: { select: { label: true, key: true } },
          },
        });
        if (!t) return err('Not found', 404);
        return NextResponse.json({
          success: true,
          data: {
            id: t.id, name: t.name, url: t.url, affiliateUrl: t.affiliateUrl,
            business: t.business, categoryKey: t.categoryKey,
            categoryLabel: t.category.label,
            discount: t.discount, logo: t.logo || null, featured: t.featured,
          },
        });
      }
      case 'news': {
        const n = await prisma.news.findUnique({ where: { id } });
        if (!n) return err('Not found', 404);
        return NextResponse.json({
          success: true,
          data: {
            id: n.id, title: n.title, url: n.url, summary: n.summary,
            cover: n.cover || null, source: n.source, sourceLogo: n.sourceLogo || null,
            category: n.category, content: n.content,
            publishedAt: n.publishedAt.toISOString(), pinned: n.pinned,
          },
        });
      }
      case 'deals': {
        const d = await prisma.deal.findUnique({ where: { id } });
        if (!d) return err('Not found', 404);
        return NextResponse.json({
          success: true,
          data: {
            id: d.id, title: d.title, url: d.url, brand: d.brand,
            brandLogo: d.brandLogo || null, category: d.category,
            discount: d.discount, description: d.description,
            startDate: d.startDate?.toISOString() || null,
            endDate: d.endDate?.toISOString() || null,
            source: d.source,
          },
        });
      }
      case 'articles': {
        const a = await prisma.article.findFirst({
          where: { id, status: 'published' },
        });
        if (!a) return err('Not found', 404);
        return NextResponse.json({
          success: true,
          data: {
            id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt,
            content: a.content, cover: a.cover || null,
            category: a.category, publishedAt: a.publishedAt.toISOString(),
            viewCount: a.viewCount,
          },
        });
      }
      case 'wechat': {
        // 已删除（v3 简化）
        return err('wechat type removed in v3', 410);
      }
      default:
        return err(`Unknown type: ${type}`);
    }
  } catch (e: any) {
    console.error(`[mobile/${type}] detail error:`, e);
    return err(e?.message || 'Internal error', 500);
  }
}
