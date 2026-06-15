import { createArticle, saveAsDraft } from '../../actions';
import { ArticleFormClient } from '../_components/ArticleFormClient';

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    cover?: string;
  };
}) {
  const prefillData = {
    prefillTitle: searchParams.title || undefined,
    prefillSlug: searchParams.slug || undefined,
    prefillExcerpt: searchParams.excerpt || undefined,
    prefillContent: searchParams.content || undefined,
    prefillCover: searchParams.cover || undefined,
  };

  return (
    <ArticleFormClient
      initialData={{
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        cover: '',
        category: '',
        author: '跨境工具说',
        tags: '',
        status: 'published',
        // v11.33 Word 导入预填
        ...prefillData,
      }}
      formAction={createArticle}
      draftAction={saveAsDraft}
    />
  );
}
