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
    // v11.33.1 标记：从 localStorage 读 content（含 base64 图片的完整 HTML）
    hasContent?: string;
  };
}) {
  const prefillData = {
    prefillTitle: searchParams.title || undefined,
    prefillSlug: searchParams.slug || undefined,
    prefillExcerpt: searchParams.excerpt || undefined,
    // v11.33.1 content 改走 localStorage（避免 URL 截断 base64 图片）
    prefillContent: searchParams.hasContent === '1' ? undefined : searchParams.content || undefined,
    prefillCover: searchParams.cover || undefined,
    prefillHasContent: searchParams.hasContent || undefined,
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
