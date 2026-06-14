'use server';
/**
 * v11.18 从 JSON 导入公众号文章到 kjgjs 后台
 * 流程：粘贴 JSON → blocks 转简化 HTML → prisma.create → 跳编辑页人工审
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { autoSlug } from '@/lib/article-utils';
import { blocksToHtml, type WechatBlock } from '@/lib/wechat-blocks-to-html';

export type ImportJsonResult =
  | { ok: true; articleId: number }
  | { ok: false; error: string };

export async function importWechatJson(formData: FormData): Promise<ImportJsonResult> {
  const rawJson = (formData.get('json') as string || '').trim();
  const sourceUrl = (formData.get('sourceUrl') as string || '').trim();

  if (!rawJson) {
    return { ok: false, error: '请粘贴 JSON 内容' };
  }
  if (rawJson.length > 500_000) {
    return { ok: false, error: 'JSON 太大（>500KB），可能粘错了' };
  }

  // 解析 JSON
  let data: any;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    return { ok: false, error: `JSON 格式错误：${e instanceof Error ? e.message : String(e)}` };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'JSON 顶层必须是对象' };
  }
  if (!data.title || typeof data.title !== 'string') {
    return { ok: false, error: 'JSON 缺少 title 字段' };
  }
  if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
    return { ok: false, error: 'JSON 缺少 blocks 数组或为空' };
  }

  // 过滤合法 block
  const validBlocks: WechatBlock[] = data.blocks.filter(
    (b: any) => b && typeof b === 'object' && typeof b.type === 'string',
  );
  if (validBlocks.length === 0) {
    return { ok: false, error: 'blocks 数组没有合法条目' };
  }

  // 转简化 HTML
  const contentHtml = blocksToHtml(validBlocks);
  if (!contentHtml || contentHtml.length < 20) {
    return { ok: false, error: 'blocks 转 HTML 后内容过短（<20 字符）' };
  }

  // 摘要：没传则从 blocks 抽
  const excerpt =
    (typeof data.excerpt === 'string' && data.excerpt) ||
    validBlocks
      .filter((b) => b.type === 'text')
      .map((b: any) => b.content)
      .join(' ')
      .slice(0, 160)
      .trim() ||
    data.title.slice(0, 160);

  // 封面：保证字符串
  const cover = typeof data.cover === 'string' && data.cover ? data.cover : null;

  // 作者
  const author = typeof data.author === 'string' && data.author ? data.author : '跨境工具说';

  // 标签
  const tags = Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === 'string') : [];
  const tagsJson = JSON.stringify(tags);

  // slug
  const baseSlug = autoSlug(data.title) || 'wechat-import';
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`.slice(0, 60);

  // 发布时间
  let publishedAt: Date | null = null;
  if (data.publishedAt) {
    const d = new Date(data.publishedAt);
    if (!isNaN(d.getTime())) publishedAt = d;
  }
  if (!publishedAt) publishedAt = new Date();

  // 写入 DB
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
      source: sourceUrl || (typeof data.source === 'string' ? data.source : '微信公众号'),
      sourceType: 'wechat-tampermonkey',
      publishedAt,
    },
  });

  revalidatePath('/admin/articles');
  revalidatePath('/articles');
  revalidatePath('/admin');

  redirect(`/admin/articles/${article.id}`);
}
