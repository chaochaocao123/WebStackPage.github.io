'use server';
/**
 * 从公众号 HTML 导入文章到 kjgjs 后台的 Server Action
 * 流程：parse → prisma.create → 跳到 /admin/articles/[newId] 编辑页（让曹总人工审）
 */
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { parseWechatArticle } from '@/lib/wechat-article-parser';
import { autoSlug } from '@/lib/article-utils';

export type ImportResult =
  | { ok: true; articleId: number }
  | { ok: false; error: string };

export async function importWechatArticle(formData: FormData): Promise<ImportResult> {
  const rawHtml = (formData.get('html') as string || '').trim();
  const sourceUrl = (formData.get('sourceUrl') as string || '').trim();

  if (!rawHtml) {
    return { ok: false, error: '请粘贴公众号文章 HTML 源码' };
  }
  if (rawHtml.length > 5_000_000) {
    return { ok: false, error: 'HTML 太大（>5MB），可能复制错了，请只复制正文页源码' };
  }

  let parsed;
  try {
    parsed = parseWechatArticle(rawHtml);
  } catch (e) {
    return { ok: false, error: `解析失败：${e instanceof Error ? e.message : String(e)}` };
  }

  if (!parsed.title) {
    return { ok: false, error: '未找到标题，请确认复制的是公众号文章页（不是首页/列表页）' };
  }
  if (!parsed.content || parsed.content.length < 20) {
    return { ok: false, error: '正文过短（<20 字符），HTML 可能不完整' };
  }

  // slug：基于 title 自动生成 + 加随机后缀避免冲突
  const baseSlug = autoSlug(parsed.title) || 'wechat-import';
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`.slice(0, 60);

  // 标签：JSON 数组（编辑页用 JSON.parse 还原）
  const tagsJson = JSON.stringify(parsed.tags);

  // 写入 DB
  const article = await prisma.article.create({
    data: {
      slug,
      title: parsed.title,
      excerpt: parsed.excerpt,
      content: parsed.content,
      cover: parsed.cover,
      author: parsed.author,
      category: null,                 // 让曹总编辑时手动选
      tags: tagsJson,
      source: sourceUrl || '微信公众号',
      sourceType: 'wechat',
      publishedAt: parsed.publishedAt || new Date(),
    },
  });

  revalidatePath('/admin/articles');
  revalidatePath('/articles');
  revalidatePath('/admin');

  // 跳到编辑页让曹总人工审核
  redirect(`/admin/articles/${article.id}`);
}
