import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateArticle, deleteArticle, pushToBaiduAction } from '../../actions';
import { ArticleFormClient } from '../_components/ArticleFormClient';

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
  };

  return (
    <ArticleFormClient
      initialData={initialData}
      formAction={updateArticle.bind(null, id)}
      deleteAction={deleteArticle.bind(null, id)}
      // v11.21 百度主动推送（绑定 id）
      pushToBaiduAction={pushToBaiduAction.bind(null, id)}
    />
  );
}
