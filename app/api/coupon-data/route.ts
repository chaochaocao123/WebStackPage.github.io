// Chrome 插件专用 API：返回所有有优惠的工具数据
// GET /api/coupon-data
// 插件 content.js 调用此接口，动态获取最新优惠数据
// CORS：允许所有来源（Chrome 插件从第三方网站调用）
// 缓存：revalidate 3600（1小时），减轻数据库压力

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const revalidate = 3600; // ISR 缓存 1 小时

const prisma = new PrismaClient();

// 从 URL 提取主域名（去掉 www 和路径）
function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// 提取域名列表（一个工具可能匹配多个域名）
function extractDomains(url: string, affiliateUrl: string): string[] {
  const domains: string[] = [];
  const mainDomain = extractDomain(url);
  if (mainDomain) domains.push(mainDomain);
  
  // 推广链接可能是不同域名（如 shulex.com → voc.ai）
  const affDomain = extractDomain(affiliateUrl);
  if (affDomain && !domains.includes(affDomain)) {
    domains.push(affDomain);
  }
  
  return domains;
}

export async function GET(request: NextRequest) {
  try {
    // 查询所有有优惠信息的工具（discount 非空）
    const tools = await prisma.tool.findMany({
      where: {
        discount: { not: '' },
      },
      select: {
        id: true,
        name: true,
        url: true,
        business: true,
        categoryKey: true,
        affiliateUrl: true,
        discount: true,
        logo: true,
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });

    // 查询分类信息
    const categories = await prisma.category.findMany({
      select: { key: true, label: true },
    });
    const catMap = new Map(categories.map(c => [c.key, c.label]));

    // 转换为插件需要的格式
    const data = tools.map(tool => {
      const domains = extractDomains(tool.url, tool.affiliateUrl);
      return {
        id: tool.id,
        name: tool.name,
        domains: domains,
        category: catMap.get(tool.categoryKey) || tool.categoryKey,
        business: tool.business,
        discount: tool.discount,
        affiliateUrl: tool.affiliateUrl,
        logo: tool.logo || null,
      };
    });

    const response = NextResponse.json({
      success: true,
      data: data,
      total: data.length,
      updatedAt: new Date().toISOString(),
    });

    // CORS：允许所有来源（Chrome 插件需要）
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return response;
  } catch (error: any) {
    console.error('[coupon-data] error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error', data: [], total: 0 },
      { status: 500 }
    );
  }
}

// CORS 预检
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
