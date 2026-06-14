'use server';
/**
 * v11.20 从 URL 一键导入公众号文章（Server Action）
 * 流程：粘 URL → 服务端选 fetcher（新榜/gs-one/本地代理）→ proxify → prisma.create → 跳编辑页
 *
 * 与 /api/wechat-fetch 共享 lib/wechat-fetchers，避免两处实现分裂
 * 流程：前端已看过预览 → 调 Server Action 复用同一 fetcher → 写库
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { autoSlug } from '@/lib/article-utils';
import { fetchWechatArticle } from '@/lib/wechat-fetchers';

export type ImportUrlResult =
  | { ok: true; articleId: number }
  | { ok: false; error: string };

export async function importWechatUrl(formData: FormData): Promise<ImportUrlResult> {
  const url = (formData.get('url') as string || '').trim();
  if (!url) {
    return { ok: false, error: '请填写公众号文章 URL' };
  }

  const newrankKey = process.env.NEWRANK_API_KEY;
  const localProxyUrl = process.env.LOCAL_PROXY_URL;
  const explicit = process.env.WECHAT_FETCHER as
    | 'newrank'
    | 'gsone'
    | 'local'
    | undefined;

  const result = await fetchWechatArticle(url, {
    fetcher: explicit,
    newrankKey,
    localProxyUrl,
  });

  if ('error' in result) {
    return {
      ok: false,
      error: result.error,
      ...(result.detail ? { detail: result.detail } : {}),
    };
  }

  const article = result;
  if (!article.content || article.content.length < 50) {
    return { ok: false, error: '抓取的内容过短（<50 字符），可能抓取失败' };
  }

  // 摘要
  const excerpt = article.desc.trim() || '';

  // 封面 = 公众号头像（曹总可改）
  const cover = article.roundHeadImg || null;

  // 作者 = 公众号昵称
  const author = article.nickName.trim() || '跨境工具说';

  // slug
  const baseSlug = autoSlug(article.title) || 'wechat-url-import';
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`.slice(0, 60);

  // 发布时间
  let publishedAt: Date | null = null;
  if (article.publishedAt) {
    const d = new Date(article.publishedAt);
    if (!isNaN(d.getTime())) publishedAt = d;
  }
  if (!publishedAt) publishedAt = new Date();

  // 写库
  const created = await prisma.article.create({
    data: {
      slug,
      title: article.title,
      excerpt,
      content: article.content,
      cover,
      author,
      category: null,
      tags: JSON.stringify([]),
      source: url,
      sourceType: 'wechat-url-import',
      publishedAt,
    },
  });

  revalidatePath('/admin/articles');
  revalidatePath('/articles');
  revalidatePath('/admin');

  redirect(`/admin/articles/${created.id}`);
}
