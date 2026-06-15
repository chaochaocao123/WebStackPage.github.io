import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateArticle, deleteArticle, pushToBaiduAction, revertToDraft } from '../../actions';
import { ArticleFormClient } from '../_components/ArticleFormClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  // v11.23 修补：非数字 id（如已删的 /admin/articles/import）显式 404，避免 prisma NaN 报错
  if (Number.isNaN(id)) notFound();
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    notFound();
  }

  // v11.28 server-side 拉一次 quota（避免客户端首屏空白）
  const startOfTodayBeijing = new Date();
  startOfTodayBeijing.setUTCHours(16, 0, 0, 0);
  if (Date.now() < startOfTodayBeijing.getTime()) {
    startOfTodayBeijing.setUTCDate(startOfTodayBeijing.getUTCDate() - 1);
  }
  const resetAt = new Date(startOfTodayBeijing.getTime() + 24 * 60 * 60 * 1000);
  const used = await prisma.baiduPushLog.count({
    where: { pushedAt: { gte: startOfTodayBeijing }, success: true },
  });
  const baiduQuotaInitial = {
    used,
    limit: 10,
    remaining: Math.max(0, 10 - used),
    resetAt: resetAt.toISOString(),
    hasBaiduToken: !!process.env.BAIDU_PUSH_TOKEN,
  };

  const initialData = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    cover: article.cover || '',
    category: article.category || '',
    author: article.author,
    tags: JSON.parse(article.tags || '[]').join(', '),
    viewCount: article.viewCount,
    // v11.21 SEO 分批管理字段
    isReposted: article.isReposted,
    sourceUrl: article.sourceUrl,
    baiduPushedAt: article.baiduPushedAt?.toISOString() || null,
    // v11.32.1 预览用
    publishedAt: article.publishedAt?.toISOString() || null,
  };

  return (
    <ArticleFormClient
      initialData={initialData}
      formAction={updateArticle.bind(null, id)}
      deleteAction={deleteArticle.bind(null, id)}
      // v11.21 百度主动推送（绑定 id）
      pushToBaiduAction={pushToBaiduAction.bind(null, id)}
      // v11.28 quota 初始值（server 拉一次，避免首屏空白）
      baiduQuotaInitial={baiduQuotaInitial}
    />
  );
}
