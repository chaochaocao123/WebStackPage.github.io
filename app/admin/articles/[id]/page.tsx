import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { updateArticle, deleteArticle } from '../../actions';
import { ArticleFormClient } from '../_components/ArticleFormClient';

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
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
  };

  return (
    <ArticleFormClient
      initialData={initialData}
      formAction={updateArticle.bind(null, id)}
      deleteAction={deleteArticle.bind(null, id)}
    />
  );
}
