import { createNews } from '../../actions';
import { NewsFormClient } from '../_components/NewsFormClient';

export default async function NewNewsPage() {
  return (
    <NewsFormClient
      initialData={null}
      formAction={createNews}
    />
  );
}
