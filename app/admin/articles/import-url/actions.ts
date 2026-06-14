'use server';
/**
 * v11.19 从 URL 一键导入公众号文章（Server Action）
 * 流程：粘 URL → 服务端调 gs-one API → proxify → prisma.create → 跳编辑页
 * 用途：配对 /api/wechat-fetch（用于前端预览），这个用于最终写库
 *
 * 设计：与 /api/wechat-fetch 逻辑几乎一致，但走 Server Action 节省一次 round trip
 *       （前端已经看过预览，确认无误后直接写库，不必再 fetch 一次）
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { autoSlug } from '@/lib/article-utils';
import { proxifyWechatImagesInHtml } from '@/lib/article-content-render';

export type ImportUrlResult =
  | { ok: true; articleId: number }
  | { ok: false; error: string };

const GS_ONE_API = 'https://www.gs-one.cn/api/public/v1/download';
const WECHAT_HOST_RE = /^https?:\/\/mp\.weixin\.qq\.com\//;

export async function importWechatUrl(formData: FormData): Promise<ImportUrlResult> {
  const url = (formData.get('url') as string || '').trim();
  if (!url) {
    return { ok: false, error: '请填写公众号文章 URL' };
  }
  if (!WECHAT_HOST_RE.test(url)) {
    return { ok: false, error: '只支持 mp.weixin.qq.com 域链接' };
  }

  // 调 gs-one
  const gsUrl = `${GS_ONE_API}?url=${encodeURIComponent(url)}&format=json`;
  let resp: Response;
  try {
    resp = await fetch(gsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*',
      },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    return {
      ok: false,
      error: `gs-one 请求失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!resp.ok) {
    return { ok: false, error: `gs-one 上游返回 ${resp.status}` };
  }

  let data: any;
  try {
    data = await resp.json();
  } catch {
    return { ok: false, error: 'gs-one 返回的不是合法 JSON' };
  }

  if (data.base_resp?.ret !== 0) {
    return {
      ok: false,
      error: `gs-one 抓取失败: ${data.base_resp?.errmsg || 'unknown'} (code: ${data.base_resp?.ret})`,
    };
  }
  if (!data.title || !data.content_noencode) {
    return { ok: false, error: 'gs-one 返回缺少 title/content_noencode，可能文章已被删除' };
  }

  // proxify 图片
  const contentHtml = proxifyWechatImagesInHtml(data.content_noencode);
  if (!contentHtml || contentHtml.length < 50) {
    return { ok: false, error: '抓取的内容过短（<50 字符），可能抓取失败' };
  }

  // 摘要
  const excerpt = (data.desc || '').trim() || '';

  // 封面（公众号头像，曹总可改）
  const cover = data.round_head_img || null;

  // 作者 = 公众号昵称
  const author = (data.nick_name || '').trim() || '跨境工具说';

  // 标签：暂空（无 jieba）
  const tagsJson = JSON.stringify([]);

  // slug
  const baseSlug = autoSlug(data.title) || 'wechat-url-import';
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`.slice(0, 60);

  // 发布时间
  let publishedAt: Date | null = null;
  if (data.create_time) {
    const d = new Date(data.create_time * 1000);
    if (!isNaN(d.getTime())) publishedAt = d;
  }
  if (!publishedAt) publishedAt = new Date();

  // 写库
  const article = await prisma.article.create({
    data: {
      slug,
      title: data.title,
      excerpt,
      content: contentHtml,
      cover,
      author,
      category: null,
      tags: tagsJson,
      source: url,
      sourceType: 'wechat-url-import',
      publishedAt,
    },
  });

  revalidatePath('/admin/articles');
  revalidatePath('/articles');
  revalidatePath('/admin');

  redirect(`/admin/articles/${article.id}`);
}
