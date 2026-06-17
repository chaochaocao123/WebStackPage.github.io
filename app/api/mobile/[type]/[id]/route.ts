// 移动端详情 API（kjgjs 配套小程序 · 决策 216 候选 · 6-17）
// 端点：GET /api/mobile/[type]/[id]
//   type = tools | news | deals | articles
//   id = 数字 ID
// 备注：公众号文章 (wechat) 待 A/B/C 选型
// 兼容：[type]/route.ts 接受 ?id=N 走详情，本文件是独立路径入口

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id: idStr } = params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

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
        if (!t) return notFound();
        return ok({
          id: t.id, name: t.name, url: t.url, affiliateUrl: t.affiliateUrl,
          business: t.business, categoryKey: t.categoryKey,
          categoryLabel: t.category.label,
          discount: t.discount, logo: t.logo || null, featured: t.featured,
        });
      }
      case 'news': {
        const n = await prisma.news.findUnique({ where: { id } });
        if (!n) return notFound();
        return ok({
          id: n.id, title: n.title, url: n.url, summary: n.summary,
          cover: n.cover || null, source: n.source, sourceLogo: n.sourceLogo || null,
          category: n.category, content: n.content,
          publishedAt: n.publishedAt.toISOString(), pinned: n.pinned,
        });
      }
      case 'deals': {
        const d = await prisma.deal.findUnique({ where: { id } });
        if (!d) return notFound();
        return ok({
          id: d.id, title: d.title, url: d.url, brand: d.brand,
          brandLogo: d.brandLogo || null, category: d.category,
          discount: d.discount, description: d.description,
          startDate: d.startDate?.toISOString() || null,
          endDate: d.endDate?.toISOString() || null,
          source: d.source,
        });
      }
      case 'articles': {
        const a = await prisma.article.findFirst({ where: { id, status: 'published' } });
        if (!a) return notFound();
        return ok({
          id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt,
          content: a.content, cover: a.cover || null,
          category: a.category, publishedAt: a.publishedAt.toISOString(),
          viewCount: a.viewCount,
        });
      }
      case 'wechat':
        return NextResponse.json(
          { success: false, error: 'wechat type not implemented yet, awaiting A/B/C selection' },
          { status: 501 }
        );
      default:
        return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (e: any) {
    console.error(`[mobile/${type}/${id}] detail error:`, e);
    return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 });
  }
}

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

function notFound() {
  return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
}
