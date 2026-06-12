import { createArticle } from '../../actions';
import { ArticleFormClient } from '../_components/ArticleFormClient';

export default async function NewArticlePage() {
  return (
    <ArticleFormClient
      initialData={null}
      formAction={createArticle}
    />
  );
}
