// 管理员 Server Actions
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { fetchFavicon } from '@/lib/data/logo-fetcher';

// ============ 鉴权相关 ============

async function createSessionToken(): Promise<string> {
  const payload = {
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天
  };
  const payloadB64 = btoa(JSON.stringify(payload));

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.SESSION_SECRET || 'default-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${payloadB64}.${signatureB64}`;
}

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string;

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login?error=1');
  }

  const token = await createSessionToken();

  cookies().set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  redirect('/admin');
}

export async function logoutAction() {
  cookies().delete('admin_session');
  redirect('/admin/login');
}

// ============ 工具管理 ============

export async function createTool(formData: FormData) {
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const business = formData.get('business') as string;
  const categoryKey = formData.get('categoryKey') as string;
  const affiliateUrl = formData.get('affiliateUrl') as string;
  const discount = formData.get('discount') as string;
  let logo = formData.get('logo') as string;
  const featured = formData.get('featured') === 'on';

  // 自动抓取 logo（如果用户没填）
  if (!logo && url) {
    const fetched = await fetchFavicon(url);
    if (fetched.url) logo = fetched.url;
  }

  await prisma.tool.create({
    data: {
      name,
      url,
      business,
      categoryKey,
      affiliateUrl,
      discount: discount || '',
      logo: logo || null,
      featured,
      sort: 0,
    },
  });

  revalidatePath('/admin/tools'); revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin/tools');
}

export async function updateTool(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;
  const business = formData.get('business') as string;
  const categoryKey = formData.get('categoryKey') as string;
  const affiliateUrl = formData.get('affiliateUrl') as string;
  const discount = formData.get('discount') as string;
  let logo = formData.get('logo') as string;
  const featured = formData.get('featured') === 'on';

  // 自动抓取 logo（如果用户清空且 url 变了）
  const old = await prisma.tool.findUnique({ where: { id }, select: { url: true, logo: true } });
  if (!logo && url && old?.url !== url) {
    const fetched = await fetchFavicon(url);
    if (fetched.url) logo = fetched.url;
  }

  await prisma.tool.update({
    where: { id },
    data: {
      name,
      url,
      business,
      categoryKey,
      affiliateUrl,
      discount: discount || '',
      logo: logo || null,
      featured,
    },
  });

  revalidatePath('/admin/tools'); revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin/tools');
}

export async function deleteTool(id: number) {
  await prisma.tool.delete({ where: { id } });
  revalidatePath('/admin/tools'); revalidatePath('/admin');
  revalidatePath('/');
}

// ============ 工具 Logo 刷新 ============

/** 刷新单个工具的 logo（异步抓取，写回 Tool.logo） */
export async function refreshToolLogoAction(toolId: number): Promise<{
  success: boolean;
  logo: string | null;
  source?: string;
  error?: string;
}> {
  const tool = await prisma.tool.findUnique({ where: { id: toolId }, select: { url: true, name: true } });
  if (!tool) return { success: false, logo: null, error: '工具不存在' };

  const result = await fetchFavicon(tool.url);
  if (result.url) {
    await prisma.tool.update({ where: { id: toolId }, data: { logo: result.url } });
    revalidatePath('/admin/tools'); revalidatePath('/');
    return { success: true, logo: result.url, source: result.source };
  }
  return { success: false, logo: null, source: result.source, error: result.error };
}

/**
 * 批量刷新工具 logo（受 Vercel 函数 10s timeout 限制，最多 8 个/批）
 * @param batchSize 本次刷新的工具数量（默认 8）
 * @returns { total, success, failed, results }
 */
export async function refreshAllLogosAction(batchSize: number = 8): Promise<{
  total: number;
  success: number;
  failed: number;
  results: Array<{ id: number; name: string; success: boolean; source?: string; error?: string }>;
}> {
  // 优先刷新没 logo 的（DDG fallback 也算有，但 html-link 优先）
  const tools = await prisma.tool.findMany({
    where: { OR: [{ logo: null }, { logo: { startsWith: 'https://icons.duckduckgo.com/' } }] },
    select: { id: true, name: true, url: true },
    take: batchSize,
  });

  const results: Array<{ id: number; name: string; success: boolean; source?: string; error?: string }> = [];
  let success = 0, failed = 0;

  // 并发 3（受 10s timeout 限制，避免 Vercel 函数超时）
  const queue = [...tools];
  async function worker() {
    while (queue.length > 0) {
      const t = queue.shift()!;
      const r = await fetchFavicon(t.url);
      if (r.url) {
        await prisma.tool.update({ where: { id: t.id }, data: { logo: r.url } });
        results.push({ id: t.id, name: t.name, success: true, source: r.source });
        success++;
      } else {
        results.push({ id: t.id, name: t.name, success: false, source: r.source, error: r.error });
        failed++;
      }
    }
  }
  await Promise.all(Array.from({ length: 3 }, () => worker()));

  revalidatePath('/admin/tools'); revalidatePath('/');
  return { total: tools.length, success, failed, results };
}

// ============ 分类管理 ============

export async function updateCategorySort(id: number, sort: number) {
  await prisma.category.update({
    where: { id },
    data: { sort },
  });
  revalidatePath('/admin/categories'); revalidatePath('/admin');
}

export async function createCategory(formData: FormData) {
  const key = formData.get('key') as string;
  const label = formData.get('label') as string;

  await prisma.category.create({
    data: { key, label, sort: 0 },
  });

  revalidatePath('/admin/categories'); revalidatePath('/admin');
  redirect('/admin/categories');
}

export async function updateCategory(id: number, formData: FormData) {
  const key = formData.get('key') as string;
  const label = formData.get('label') as string;
  const sort = parseInt(formData.get('sort') as string) || 0;

  await prisma.category.update({
    where: { id },
    data: { key, label, sort },
  });

  revalidatePath('/admin/categories'); revalidatePath('/admin');
  redirect('/admin/categories');
}

export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/categories'); revalidatePath('/admin');
}

// ============ 文章管理 ============

/** 工具函数：从 formData 安全读 isReposted / sourceUrl */
function readRepostFields(formData: FormData): {
  isReposted: boolean;
  sourceUrl: string | null;
} {
  const isReposted = formData.get('isReposted') === 'on';
  const raw = (formData.get('sourceUrl') as string | null)?.trim() || '';
  return {
    isReposted,
    sourceUrl: isReposted ? (raw || null) : null,
  };
}

export async function createArticle(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const cover = formData.get('cover') as string;
  const category = formData.get('category') as string;
  const tags = formData.get('tags') as string;
  const author = formData.get('author') as string || '跨境工具说';
  const sourceType = formData.get('sourceType') as string || 'manual';
  const { isReposted, sourceUrl } = readRepostFields(formData);

  await prisma.article.create({
    data: {
      slug,
      title,
      content: content || '',
      excerpt,
      cover: cover || null,
      category: category || null,
      tags: JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : []),
      author,
      sourceType,
      isReposted,
      sourceUrl,
    },
  });

  revalidatePath('/admin/articles'); revalidatePath('/admin');
  revalidatePath('/articles');
  redirect('/admin/articles');
}

export async function updateArticle(id: number, formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const excerpt = formData.get('excerpt') as string;
  const cover = formData.get('cover') as string;
  const category = formData.get('category') as string;
  const tags = formData.get('tags') as string;
  const author = formData.get('author') as string || '跨境工具说';
  const viewCount = parseInt(formData.get('viewCount') as string) || 0;
  const { isReposted, sourceUrl } = readRepostFields(formData);

  await prisma.article.update({
    where: { id },
    data: {
      slug,
      title,
      content: content || '',
      excerpt,
      cover: cover || null,
      category: category || null,
      tags: JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : []),
      author,
      viewCount,
      isReposted,
      sourceUrl,
    },
  });

  revalidatePath('/admin/articles'); revalidatePath('/admin');
  revalidatePath('/articles');
  redirect('/admin/articles');
}

export async function deleteArticle(id: number) {
  await prisma.article.delete({ where: { id } });
  revalidatePath('/admin/articles'); revalidatePath('/admin');
  revalidatePath('/articles');
}

// ============ v11.21 百度主动推送（首发策略核心） ============

/**
 * 主动推送到百度站长平台普通收录 API
 * 端点：http://data.zz.baidu.com/urls?site=kjgjs.cn&token=xxx
 * POST body：每行一个 URL（单次最多 2000 条）
 *
 * Vercel 出口在 AWS 美东，国内服务（百度站长平台 data.zz.baidu.com）可能调不通
 * 兜底：通过 LOCAL_PROXY_URL 走用户本地代理（Vercel 加环境变量即可）
 */
export async function pushToBaiduAction(articleId: number): Promise<{
  ok: boolean;
  message: string;
  pushedAt?: string;
  detail?: string;
  baiduRemain?: number;  // 百度返回的实时剩余 quota
  remainingToday?: number;  // 本地统计今日剩余
}> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { slug: true, isReposted: true, sourceUrl: true },
  });
  if (!article) {
    return { ok: false, message: '文章不存在' };
  }
  if (article.isReposted) {
    return { ok: false, message: '转载文章不推百度（已 noindex）' };
  }

  const token = process.env.BAIDU_PUSH_TOKEN;
  if (!token) {
    return { ok: false, message: '未配置 BAIDU_PUSH_TOKEN（Vercel 环境变量）' };
  }

  const url = `https://kjgjs.cn/articles/${article.slug}`;
  const apiEndpoint = `http://data.zz.baidu.com/urls?site=kjgjs.cn&token=${encodeURIComponent(token)}`;

  // Vercel 出口可能在 AWS 美东，data.zz.baidu.com 国内服务拒接
  // 优先走本地代理（曹总电脑跑 proxy.js 之类）；未配则直连
  const proxyUrl = process.env.LOCAL_PROXY_URL; // 例如 http://127.0.0.1:9527
  const fetcher = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/proxy?target=baidu&token=${encodeURIComponent(token)}` : null;

  let res: Response;
  try {
    if (fetcher) {
      // 走本地代理（用户电脑跑代理服务，转发到百度）
      res = await fetch(fetcher, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: url,
        signal: AbortSignal.timeout(8000),
      });
    } else {
      // 直连（Vercel 出口可能不通，依赖国内 Vercel 节点或用户代理服务）
      res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: url,
        signal: AbortSignal.timeout(8000),
      });
    }
  } catch (e: any) {
    // 写失败日志
    await prisma.baiduPushLog.create({
      data: {
        articleId,
        articleSlug: article.slug,
        url,
        success: false,
        detail: `请求失败：${e?.message || String(e)}`,
      },
    });
    return {
      ok: false,
      message: '请求百度失败（Vercel 出口可能不通）',
      detail: e?.message || String(e),
    };
  }

  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* 非 JSON */ }

  // 计算本地今日剩余 quota（北京时区）
  const startOfTodayBeijing = new Date();
  startOfTodayBeijing.setUTCHours(16, 0, 0, 0);
  if (Date.now() < startOfTodayBeijing.getTime()) {
    startOfTodayBeijing.setUTCDate(startOfTodayBeijing.getUTCDate() - 1);
  }
  const usedToday = await prisma.baiduPushLog.count({
    where: { pushedAt: { gte: startOfTodayBeijing }, success: true },
  });
  const remainingToday = Math.max(0, 10 - usedToday - 1); // -1 预扣本次（成功后 +1）

  if (parsed?.success !== undefined) {
    // 百度标准响应：{"remain":9999,"success":1,"not_same_site":[],"not_valid":[]}
    const successCount = parsed.success || 0;
    const baiduRemain = parsed.remain;
    if (successCount > 0) {
      const pushedAt = new Date();
      await prisma.$transaction([
        prisma.article.update({
          where: { id: articleId },
          data: { baiduPushedAt: pushedAt },
        }),
        prisma.baiduPushLog.create({
          data: {
            articleId,
            articleSlug: article.slug,
            url,
            success: true,
            baiduRemain: typeof baiduRemain === 'number' ? baiduRemain : null,
            baiduSuccess: successCount,
          },
        }),
      ]);
      revalidatePath('/admin/articles');
      revalidatePath(`/admin/articles/${articleId}`);
      return {
        ok: true,
        message: `已推送 ${successCount} 条`,
        pushedAt: pushedAt.toISOString(),
        baiduRemain: typeof baiduRemain === 'number' ? baiduRemain : undefined,
        remainingToday: 10 - usedToday - 1, // 这次成功后实际剩余
      };
    }
    // success=0 写日志（不算 quota 扣减）
    await prisma.baiduPushLog.create({
      data: {
        articleId,
        articleSlug: article.slug,
        url,
        success: false,
        baiduRemain: typeof baiduRemain === 'number' ? baiduRemain : null,
        baiduSuccess: 0,
        detail: text.slice(0, 500),
      },
    });
    return {
      ok: false,
      message: '百度未接受',
      detail: text.slice(0, 200),
      baiduRemain: typeof baiduRemain === 'number' ? baiduRemain : undefined,
      remainingToday,
    };
  }

  // 非标准响应，写失败日志
  await prisma.baiduPushLog.create({
    data: {
      articleId,
      articleSlug: article.slug,
      url,
      success: false,
      detail: `HTTP ${res.status}: ${text.slice(0, 500)}`,
    },
  });
  return {
    ok: false,
    message: `百度返回 ${res.status}`,
    detail: text.slice(0, 200),
    remainingToday,
  };
}

// ============ 优惠管理 ============

export async function createDeal(formData: FormData) {
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const brand = formData.get('brand') as string;
  const brandLogo = formData.get('brandLogo') as string;
  const category = formData.get('category') as string;
  const discount = formData.get('discount') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  await prisma.deal.create({
    data: {
      title,
      url,
      brand,
      brandLogo: brandLogo || null,
      category: category || null,
      discount: discount || null,
      description: description || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath('/admin/deals'); revalidatePath('/admin');
  revalidatePath('/deals');
  redirect('/admin/deals');
}

export async function updateDeal(id: number, formData: FormData) {
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const brand = formData.get('brand') as string;
  const brandLogo = formData.get('brandLogo') as string;
  const category = formData.get('category') as string;
  const discount = formData.get('discount') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;

  await prisma.deal.update({
    where: { id },
    data: {
      title,
      url,
      brand,
      brandLogo: brandLogo || null,
      category: category || null,
      discount: discount || null,
      description: description || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  revalidatePath('/admin/deals'); revalidatePath('/admin');
  revalidatePath('/deals');
  redirect('/admin/deals');
}

export async function deleteDeal(id: number) {
  await prisma.deal.delete({ where: { id } });
  revalidatePath('/admin/deals'); revalidatePath('/admin');
  revalidatePath('/deals');
}

// ============ 广告位管理 ============

export async function updateAdSpot(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const linkUrl = formData.get('linkUrl') as string;
  const active = formData.get('active') === 'on';
  const sort = parseInt(formData.get('sort') as string) || 0;

  await prisma.adSpot.update({
    where: { id },
    data: { name, imageUrl, linkUrl, active, sort },
  });

  revalidatePath('/admin/ads'); revalidatePath('/admin');
  redirect('/admin/ads');
}

// ============ 资讯管理 ============

export async function createNews(formData: FormData) {
  const title = (formData.get('title') as string || '').trim();
  const url = (formData.get('url') as string || '').trim();
  const source = (formData.get('source') as string || 'manual').trim();
  const category = (formData.get('category') as string || '').trim() || null;
  const summary = (formData.get('summary') as string || '').trim() || null;
  const cover = (formData.get('cover') as string || '').trim() || null;
  const publishedAtRaw = formData.get('publishedAt') as string;
  const pinned = formData.get('pinned') === 'on';

  if (!title || !url) {
    throw new Error('标题和链接必填');
  }

  // publishedAt 可能是 datetime-local 空字符串，fallback 到 now
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();

  // 用 url 做唯一键去重
  await prisma.news.upsert({
    where: { url },
    create: {
      title,
      url,
      source,
      sourceType: 'manual',
      category,
      summary,
      cover,
      publishedAt,
      pinned,
    },
    update: {
      title,
      source,
      category,
      summary,
      cover,
      publishedAt,
      pinned,
    },
  });

  revalidatePath('/admin/news'); revalidatePath('/admin');
  revalidatePath('/news');
  redirect('/admin/news');
}

export async function updateNews(id: number, formData: FormData) {
  const title = (formData.get('title') as string || '').trim();
  const url = (formData.get('url') as string || '').trim();
  const source = (formData.get('source') as string || 'manual').trim();
  const category = (formData.get('category') as string || '').trim() || null;
  const summary = (formData.get('summary') as string || '').trim() || null;
  const cover = (formData.get('cover') as string || '').trim() || null;
  const publishedAtRaw = formData.get('publishedAt') as string;
  const pinned = formData.get('pinned') === 'on';

  if (!title || !url) {
    throw new Error('标题和链接必填');
  }

  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : new Date();

  await prisma.news.update({
    where: { id },
    data: {
      title,
      url,
      source,
      category,
      summary,
      cover,
      publishedAt,
      pinned,
    },
  });

  revalidatePath('/admin/news'); revalidatePath('/admin');
  revalidatePath('/admin/news/' + id);
  revalidatePath('/news');
  redirect('/admin/news');
}

export async function deleteNews(id: number) {
  await prisma.news.delete({ where: { id } });
  revalidatePath('/admin/news'); revalidatePath('/admin');
  revalidatePath('/news');
}

export async function togglePinNews(id: number) {
  const current = await prisma.news.findUnique({ where: { id }, select: { pinned: true } });
  if (!current) return;
  await prisma.news.update({
    where: { id },
    data: { pinned: !current.pinned },
  });
  revalidatePath('/admin/news'); revalidatePath('/admin');
  revalidatePath('/news');
}
